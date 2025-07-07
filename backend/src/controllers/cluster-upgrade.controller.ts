import { ElasticClient } from "../clients/elastic.client";
import { NextFunction, Request, Response } from "express";
import logger from "../logger/logger";
import {
	getClusterInfoById,
	getElasticsearchDeprecation,
	getKibanaDeprecation,
} from "../services/cluster-info.service";
import { KibanaClient } from "../clients/kibana.client";
import { NodeStatus, PrecheckStatus } from "../enums";
import { getLatestRunsByPrecheck, getMergedPrecheckStatus, runPrecheck } from "../services/precheck-runs.service";
import { clusterUpgradeJobService } from "../services/cluster-upgrade-job.service";
import { clusterUpgradeService } from "../services/cluster-upgrade.service";
import { clusterNodeService, getAllElasticNodes } from "../services/cluster-node.service";

export const getUpgradeDetails = async (req: Request, res: Response) => {
	try {
		const clusterId = req.params.clusterId;
		const client = await ElasticClient.buildClient(clusterId);
		const kibanaClient = await KibanaClient.buildClient(clusterId);
		const clusterInfo = await getClusterInfoById(clusterId);
		const clusterUpgradeJob = await clusterUpgradeJobService.getLatestClusterUpgradeJobByClusterId(clusterId);

		const kibanaUrl = clusterInfo.kibana?.url;

		const [elasticsearchDeprecation, kibanaDeprecation, kibanaVersion, elasticNodes, snapshots, prechecks] =
			await Promise.all([
				getElasticsearchDeprecation(clusterId),
				getKibanaDeprecation(clusterId),
				kibanaClient.getKibanaVersion(),
				getAllElasticNodes(clusterId),
				client.getValidSnapshots(),
				getLatestRunsByPrecheck(clusterId),
			]);
		const esDeprecationCount = elasticsearchDeprecation.counts;
		const kibanaDeprecationCount = kibanaDeprecation.counts;
		const allPrechecks = prechecks.flat();
		if (allPrechecks.length === 0 && snapshots.length > 0) {
			const runId = await runPrecheck(elasticNodes, clusterId);
			logger.info(`Prechecks initiated successfully for cluster '${clusterId}' with Playbook Run ID '${runId}'.`);
		}

		const isKibanaUpgraded = kibanaVersion === clusterUpgradeJob?.targetVersion ? true : false;
		//verifying upgradability

		const isESUpgraded = elasticNodes.filter((item) => item.status !== NodeStatus.UPGRADED).length === 0;

		res.send({
			elastic: {
				isUpgradable: !isESUpgraded,
				deprecations: { ...esDeprecationCount },
				snapshot: {
					snapshot: snapshots.length > 0 ? snapshots[0] : null,
					creationPage: kibanaUrl ? `${kibanaUrl}/app/management/data/snapshot_restore/snapshots` : null,
				},
			},
			kibana: {
				isUpgradable: !isKibanaUpgraded,
				deprecations: { ...kibanaDeprecationCount },
			},
			precheck: {
				status:
					allPrechecks.length == 0
						? PrecheckStatus.RUNNING
						: getMergedPrecheckStatus(allPrechecks.map((precheck) => precheck.status)),
			},
		});
	} catch (error: any) {
		res.status(501).json({ err: error.message });
	}
};

export const getElasticDeprecationInfo = async (req: Request, res: Response) => {
	try {
		const clusterId = req.params.clusterId;
		const deprecations = (await getElasticsearchDeprecation(clusterId)).deprecations;
		res.status(200).send(deprecations);
	} catch (err: any) {
		logger.info(err);
		res.status(400).send({ err: err.message });
	}
};

export const handleUpgrades = async (req: Request, res: Response) => {
	const clusterId = req.params.clusterId;
	const { nodes } = req.body;
	try {
		let isUpgrading = false;
		const allNodes = await getAllElasticNodes(clusterId);
		allNodes.forEach((node) => {
			if (node.status === NodeStatus.UPGRADING) {
				isUpgrading = true;
			}
		});
		if (isUpgrading) {
			res.status(400).send({ err: "There is already a node Upgrade in progress first let it complete" });
			return;
		}
		nodes.forEach((nodeId: string) => {
			const triggered = clusterUpgradeService.triggerElasticNodeUpgrade(nodeId, clusterId);
			if (!triggered) {
				res.status(400).send({ err: "Upgrade failed node not available" });
			} else {
				return;
			}
		});
		res.status(200).send({ message: "Upgradation triggered" });
	} catch (err: any) {
		logger.error("Error performing upgrade:", err);
		res.status(400).send({ err: err.message });
	}
};

export const getKibanaDeprecationsInfo = async (req: Request, res: Response) => {
	try {
		const clusterId = req.params.clusterId;
		const deprecations = (await getKibanaDeprecation(clusterId)).deprecations;
		res.send(deprecations);
	} catch (error: any) {
		logger.error(error);
		res.status(400).send({ err: error.message });
	}
};

export const getValidSnapshots = async (req: Request, res: Response) => {
	try {
		const { clusterId } = req.params;
		const client = await ElasticClient.buildClient(clusterId);
		const snapshots = await client.getValidSnapshots();
		res.send(snapshots);
	} catch (error: any) {
		logger.error("Error fetching node details:", error);
		res.status(400).send({ err: error.message });
	}
};

export const createClusterUpgradeJob = async (req: Request, res: Response, next: NextFunction) => {
	const { clusterId } = req.params;
	const { version } = req.body;
	try {
		const elasticClient = await ElasticClient.buildClient(clusterId);
		const currentVersion = await elasticClient.getElasticsearchVersion();
		await clusterUpgradeJobService.createClusterUpgradeJob({
			clusterId: clusterId,
			currentVersion: currentVersion,
			targetVersion: version,
		});
		await clusterNodeService.updateNodesPartially({ clusterId: clusterId }, { status: NodeStatus.AVAILABLE });
		res.status(201).send({
			message: `Target version set succesfully`,
		});
	} catch (error: any) {
		next(error);
	}
};

export const handleKibanaUpgrades = async (req: Request, res: Response) => {
	const clusterId = req.params.clusterId;
	const { nodes } = req.body;
	try {
		nodes.forEach((nodeId: string) => {
			clusterUpgradeService.triggerKibanaNodeUpgrade(nodeId, clusterId);
		});
		res.status(200).send({ message: "Upgradation triggered" });
	} catch (err: any) {
		logger.error("Error performing upgrade:", err);
		res.status(400).send({ err: err.message });
	}
};

export const handleUpgradeAll = async (req: Request, res: Response) => {
	const clusterId = req.params.clusterId;
	const nodes = await getAllElasticNodes(clusterId);
	let failedUpgrade = false;
	let upgradingNode = false;
	const nodesToBeUpgraded = nodes.filter((node) => {
		if (node.status === NodeStatus.AVAILABLE) {
			return true;
		} else if (node.status === NodeStatus.FAILED) {
			failedUpgrade = true;
			return false;
		} else if (node.status === NodeStatus.UPGRADING) {
			upgradingNode = true;
			return false;
		} else {
			return false;
		}
	});
	if (failedUpgrade) {
		res.status(400).send({ err: "Cannot trigger upgrade all as there is failed node" });
		return;
	}
	if (upgradingNode) {
		res.status(400).send({ err: "Cannot trigger upgrade all as there is failed node" });
	}
	try {
		await clusterUpgradeService.triggerElasticNodesUpgrade(nodesToBeUpgraded, clusterId);
		res.status(200).send({ message: "Upgradation triggered" });
	} catch (err: any) {
		logger.error("Error performing upgrade:", err);
		res.status(400).send({ err: err.message });
	}
};

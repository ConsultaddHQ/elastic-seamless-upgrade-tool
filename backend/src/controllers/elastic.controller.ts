import { ElasticClient } from "../clients/elastic.client";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import logger from "../logger/logger";
import { IClusterInfo, IElasticInfo, IKibanaInfo } from "../models/cluster-info.model";
import {
	createOrUpdateClusterInfo,
	getAllClusters,
	getClusterInfo,
	getClusterInfoById,
	getElasticsearchDeprecation,
	getKibanaDeprecation,
	verifyElasticCredentials,
	verifyKibanaCredentials,
} from "../services/cluster-info.service";
import { getAllElasticNodes, syncNodeData } from "../services/elastic-node.service.";
import { KibanaClient } from "../clients/kibana.client";
import path from "path";
import { normalizeNodeUrl } from "../utils/utlity.functions";
import { createKibanaNodes } from "../services/kibana-node.service";
import { NodeStatus, PrecheckStatus } from "../enums";
import { clusterMonitorService } from "../services/cluster-monitor.service";
import { getLatestRunsByPrecheck, getMergedPrecheckStatus, runPrecheck } from "../services/precheck-runs.service";
import { createSSHPrivateKeyFile } from "../utils/ssh-utils";
import { clusterUpgradeJobService } from "../services/cluster-upgrade-job.service";
import {
	triggerElasticNodeUpgrade,
	triggerElasticNodesUpgrade,
	triggerKibanaNodeUpgrade,
} from "../services/cluster-upgrade.service";
import { clusterNodeService } from "../services/cluster-node.service";
import { ClusterNodeType } from "../models/cluster-node.model";

export const healthCheck = async (req: Request, res: Response) => {
	try {
		const clusterId = req.params.clusterId;
		const client = await ElasticClient.buildClient(clusterId);
		const health = await client.getClusterhealth();
		res.send(health);
	} catch (err: any) {
		logger.info(err);
		res.status(400).send({ err: err.message });
	}
};

export const getClusterDetails = async (req: Request, res: Response) => {
	try {
		const clusterId = req.params.clusterId;
		const clusterInfo = await getClusterInfo(clusterId);
		clusterMonitorService.addCluster(clusterId);
		res.send(clusterInfo);
	} catch (err: any) {
		logger.info(err);
		res.status(400).send({ err: err.message });
	}
};

export const addOrUpdateClusterDetail = async (req: Request, res: Response) => {
	try {
		const clusterId = "cluster-id";
		const elastic: IElasticInfo = req.body.elastic;
		const kibana: IKibanaInfo = req.body.kibana;
		const kibanaConfigs = req.body.kibanaConfigs;

		const sshKey = req.body.key;

		const keyPath = createSSHPrivateKeyFile(sshKey);

		const clusterInfo: IClusterInfo = {
			elastic: {
				...elastic,
				url: normalizeNodeUrl(elastic.url),
			},
			kibana: {
				...kibana,
				url: normalizeNodeUrl(kibana.url),
			},
			clusterId: clusterId,
			certificateIds: req.body.certificateIds,
			infrastructureType: req.body.infrastructureType,
			pathToKey: keyPath,
			key: sshKey,
			sshUser: req.body.sshUser,
			kibanaConfigs: kibanaConfigs,
		};
		const elasticCredsVerificationResult = await verifyElasticCredentials(clusterInfo.elastic);
		const kibanaCredsVerificationResult = await verifyKibanaCredentials(clusterInfo.kibana);
		if (!elasticCredsVerificationResult) {
			res.status(400).send({ err: "Invalid Elastic credentials" });
			return;
		}
		if (!kibanaCredsVerificationResult) {
			res.status(400).send({ err: "Invalid Kibana credentials" });
			return;
		}
		const result = await createOrUpdateClusterInfo(clusterInfo);

		if (kibanaConfigs && kibanaConfigs.length && kibana.username && kibana.password) {
			await createKibanaNodes(kibanaConfigs, clusterId);
		}
		res.send({
			message: result.isNew ? "Cluster info saved" : "Cluster info updated",
			clusterId: result.clusterId,
		}).status(201);
		await syncNodeData(clusterId);
	} catch (err: any) {
		logger.info(err);
		res.status(400).send({ err: err.message });
	}
};

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

export const getNodesInfo = async (req: Request, res: Response) => {
	try {
		const clusterId = req.params.clusterId;
		const elasticNodes = await getAllElasticNodes(clusterId);
		const isDataNodeDisabled = elasticNodes.some((node) => node.status === NodeStatus.UPGRADING);
		const isMasterDisabled =
			elasticNodes.some(
				(node) => node.roles.includes("data") && !node.isMaster && node.status !== NodeStatus.UPGRADED
			) || isDataNodeDisabled;
		let nodes = elasticNodes.map((node) => {
			if (node.isMaster) {
				return {
					nodeId: node.nodeId,
					clusterId: node.clusterId,
					name: node.name,
					version: node.version,
					ip: node.ip,
					roles: ["master"],
					os: node.os,
					isMaster: node.isMaster,
					status: node.status,
					progress: node.progress,
					disabled: isMasterDisabled,
				};
			}
			if (node.roles.includes("data")) {
				return {
					nodeId: node.nodeId,
					clusterId: node.clusterId,
					name: node.name,
					version: node.version,
					ip: node.ip,
					roles: ["data"],
					os: node.os,
					isMaster: node.isMaster,
					status: node.status,
					progress: node.progress,
					disabled: isDataNodeDisabled,
				};
			}
		});
		const rolePriority = (roles: string[]) => {
			if (roles.includes("data")) return 1;
			if (roles.includes("master-eligible")) return 2;
			if (roles.includes("master")) return 3;
			return 4;
		};
		nodes.sort((a, b) => rolePriority(a?.roles ?? []) - rolePriority(b?.roles ?? []));
		res.send(nodes);
	} catch (error: any) {
		logger.error("Error fetching node details:", error);
		res.status(400).send({ err: error.message });
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
			const triggered = triggerElasticNodeUpgrade(nodeId, clusterId);
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

export const uploadCertificates = async (req: Request, res: Response) => {
	try {
		const files = req.files as Express.Multer.File[];
		const fileIds = files.map((file: Express.Multer.File) => file.filename);
		res.status(200).json({ certificateIds: fileIds });
	} catch (error) {
		console.error(error);
		res.status(500).json({ err: "Failed to upload files" });
	}
};

export const getNodeInfo = async (req: Request, res: Response) => {
	const { nodeId } = req.params;
	try {
		const data = await clusterNodeService.getElasticNodeById(nodeId);
		res.send(data);
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

export const verifySshKey = async (req: Request, res: Response) => {
	const { pathToKey } = req.body;
	try {
		if (!pathToKey) {
			res.status(400).send({ success: false, err: "SSH key path is required." });
		}

		const resolvedPath = path.resolve(pathToKey);

		if (!fs.existsSync(resolvedPath)) {
			res.status(400).json({ success: false, err: "mentioned path to key, does not exist" });
			return;
		}

		const fileContent = fs.readFileSync(resolvedPath, "utf8");

		if (!fileContent.startsWith("-----BEGIN ") || !fileContent.includes("PRIVATE KEY-----")) {
			res.status(400).send({ success: false, err: "Invalid SSH private key format." });
			return;
		}

		res.send({ success: true, message: "SSH key is valid." });
		return;
	} catch (error) {
		console.error("Error verifying SSH key:", error);
		res.status(500).json({ success: false, err: "Error verifying ssh key please contact owner" });
	}
};

export const verfiyCluster = async (req: Request, res: Response) => {
	try {
		const clusters = await getAllClusters();
		if (clusters.length > 0) {
			res.send({
				clusterAvailable: true,
				clusterData: clusters[0]
					? {
							elastic: {
								url: clusters[0].elastic.url ?? null,
								username: clusters[0].elastic.username ?? null,
								password: clusters[0].elastic.password ?? null,
								apiKey: clusters[0].elastic.apiKey ?? null,
							},
							kibana: clusters[0].kibana
								? {
										url: clusters[0].kibana.url ?? null,
										username: clusters[0].kibana.username ?? null,
										password: clusters[0].kibana.password ?? null,
										apiKey: clusters[0].kibana.apiKey ?? null,
									}
								: null,
							clusterId: clusters[0].clusterId ?? null,
							certificateIds: clusters[0].certificateIds ?? null,
							infrastructureType: clusters[0].infrastructureType ?? null,
							pathToKey: clusters[0].key ?? null,
							sshUser: clusters[0].sshUser,
							kibanaConfigs: clusters[0].kibanaConfigs ? clusters[0].kibanaConfigs : [],
						}
					: null,
			});
		} else {
			res.send({
				clusterAvailable: false,
			});
		}
	} catch (error: any) {
		logger.error("Unable to fetch cluster availibility info", error.message);
		res.status(501).send({
			err: "Unable to fetch cluster availibility info",
		});
	}
};

export const getKibanaNodesInfo = async (req: Request, res: Response) => {
	try {
		const clusterId = req.params.clusterId;
		const kibanaNodes = await clusterNodeService.getNodes(clusterId, ClusterNodeType.KIBANA);
		res.send(kibanaNodes);
	} catch (error: any) {
		logger.error("Error fetching kibana node details:", error);
		res.status(400).send({ err: error.message });
	}
};

export const handleKibanaUpgrades = async (req: Request, res: Response) => {
	const clusterId = req.params.clusterId;
	const { nodes } = req.body;
	try {
		nodes.forEach((nodeId: string) => {
			triggerKibanaNodeUpgrade(nodeId, clusterId);
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
		await triggerElasticNodesUpgrade(nodesToBeUpgraded, clusterId);
		res.status(200).send({ message: "Upgradation triggered" });
	} catch (err: any) {
		logger.error("Error performing upgrade:", err);
		res.status(400).send({ err: err.message });
	}
};

import { ElasticClient } from "../clients/elastic.client";
import { Request, Response } from "express";
import fs from "fs";
import logger from "../logger/logger";
import { IClusterInfo, IElasticInfo, IKibanaInfo } from "../models/cluster-info.model";
import {
	createOrUpdateClusterInfo,
	getAllClusters,
	getClusterInfo,
	getClusterInfoById,
	verifyElasticCredentials,
	verifyKibanaCredentials,
} from "../services/cluster-info.service";
import path from "path";
import { normalizeNodeUrl } from "../utils/utlity.functions";
import { NodeStatus } from "../enums";
import { clusterMonitorService } from "../services/cluster-monitor.service";
import { createSSHPrivateKeyFile } from "../utils/ssh-utils";
import { clusterNodeService, createKibanaNodes, getAllElasticNodes } from "../services/cluster-node.service";
import { ClusterNodeType } from "../models/cluster-node.model";
import { syncElasticNodesData } from "../services/sync.service";
import { randomUUID } from "crypto";

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
		const body = req.body;
		const getClusterId = async (clusterId: string | undefined) => {
			if (clusterId) {
				const existingCluster = await getClusterInfoById(clusterId);
				if (existingCluster && existingCluster.elastic.url !== body.elastic.url) {
					return randomUUID();
				}
				return clusterId;
			}
			return randomUUID();
		};
		const clusterId = await getClusterId(body.clusterId);
		const elastic: IElasticInfo = body.elastic;
		const kibana: IKibanaInfo = body.kibana;
		const kibanaConfigs = body.kibanaConfigs;

		const sshKey = body.key;

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
		await syncElasticNodesData(clusterId);
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

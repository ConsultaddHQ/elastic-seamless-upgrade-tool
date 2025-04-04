import { ElasticClient } from "../clients/elastic.client";
import logger from "../logger/logger";
import ElasticNode, { IElasticNode, IElasticNodeDocument, NodeStatus } from "../models/elastic-node.model";
import { getClusterInfoById } from "./cluster-info.service";
import { ansibleExecutionManager } from "./ansible.service";

export const createOrUpdateElasticNode = async (elasticNode: IElasticNode): Promise<IElasticNodeDocument> => {
	const nodeId = elasticNode.nodeId;
	const data = await ElasticNode.findOneAndUpdate(
		{ nodeId: nodeId },
		{ ...elasticNode },
		{ new: true, upsert: true, runValidators: true }
	);
	return data;
};

export const getElasticNodeById = async (nodeId: string): Promise<IElasticNode | null> => {
	const elasticNode = await ElasticNode.findOne({ nodeId: nodeId });
	if (!elasticNode) return null;
	return elasticNode;
};

export const getAllElasticNodes = async (clusterId: string): Promise<IElasticNode[]> => {
	try {
		await syncNodeData(clusterId);
	} catch (error) {
		logger.error("Unable to sync with Elastic search instance! Maybe the connection is breaked");
	} finally {
		const elasticNodes = await ElasticNode.find({ clusterId: clusterId });
		return elasticNodes;
	}
};

export const syncNodeData = async (clusterId: string) => {
	try {
		const client = await ElasticClient.buildClient(clusterId);
		const clusterInfo = await getClusterInfoById(clusterId);
		const response: any = await client.getClient().nodes.info({
			filter_path: "nodes.*.name,nodes.*.roles,nodes.*.os.name,nodes.*.os.version,nodes.*.version,nodes.*.ip",
		});
		const masterNode: any = await client.getClient().cat.master({
			format: "json",
		});
		const elasticNodes: IElasticNode[] | null = Object.entries(response.nodes).map(
			([key, value]: [string, any]) => ({
				nodeId: key,
				clusterId: clusterId,
				ip: value.ip,
				name: value.name,
				version: value.version,
				roles: value.roles,
				os: value.os,
				progress: 0,
				isMaster: masterNode[0].id === key,
				status: NodeStatus.AVAILABLE,
			})
		);
		for (const node of elasticNodes) {
			const existingNode = await ElasticNode.findOne({ nodeId: node.nodeId });
			if (existingNode) {
				if (existingNode.status !== NodeStatus.UPGRADED) {
					node.status = existingNode.status;
					node.progress = existingNode.progress;
				}
			}
			if (node.version === clusterInfo.targetVersion) {
				node.status = NodeStatus.UPGRADED;
				node.progress = 100;
			}

			await ElasticNode.findOneAndUpdate({ nodeId: node.nodeId }, node, {
				new: true,
				runValidators: true,
				upsert: true,
			});
		}
	} catch (error) {
		logger.error("Error syncing nodes from Elasticsearch:", error);
	}
};

export const updateNodeStatus = async (
	identifier: Record<string, any>,
	newStatus: string
): Promise<IElasticNodeDocument | null> => {
	try {
		const updatedNode = await ElasticNode.findOneAndUpdate(
			identifier,
			{ status: newStatus },
			{ new: true, runValidators: true }
		);

		if (!updatedNode) {
			logger.debug(`Node with identifier ${identifier} not found.`);
			return null;
		}

		return updatedNode;
	} catch (error: any) {
		console.error(`Error updating status for node ${identifier}: ${error.message}`);
		throw error;
	}
};

export const updateNode = async (identifier: Record<string, any>, updatedNodeValues: Partial<IElasticNode>) => {
	try {
		const updatedNode = await ElasticNode.findOneAndUpdate(identifier, { $set: updatedNodeValues }, { new: true });
		if (!updatedNode) {
			throw new Error(`Node with identfier ${identifier} not found`);
		}
	} catch (error) {
		// throw new Error(`Unable to fin`);
	}
};

export const updateNodeProgress = async (identifier: Record<string, any>, progress: number) => {
	try {
		const updatedNode = await ElasticNode.findOneAndUpdate(
			{ identifier },
			{ progress: progress },
			{ new: true, runValidators: true }
		);

		if (!updatedNode) {
			logger.debug(`Node with identifier ${identifier} not found.`);
			return null;
		}
		return updatedNode;
	} catch (error: any) {
		console.error(`Error updating progress for node ${identifier}: ${error.message}`);
		throw error;
	}
};

export const triggerNodeUpgrade = async (nodeId: string, clusterId: string) => {
	try {
		const node = await getElasticNodeById(nodeId);
		if (!node) {
			return false;
		}
		const clusterInfo = await getClusterInfoById(clusterId);
		const pathToKey = clusterInfo.pathToKey ? clusterInfo.pathToKey : "";

		await ansibleExecutionManager.createAnsibleInventory([node], pathToKey);
		if (!clusterInfo.targetVersion || !clusterInfo.elastic.username || !clusterInfo.elastic.password) {
			return false;
		}

		ansibleExecutionManager.runPlaybook("playbooks/main.yml", "ansible_inventory.ini", {
			elk_version: clusterInfo.targetVersion,
			username: clusterInfo.elastic.username,
			password: clusterInfo.elastic.password,
		});
		return new Promise((resolve, reject) => resolve(true));
	} catch (error) {
		logger.error(`Error performing upgrade for node with id ${nodeId}`);
		return false;
	}
};

export const triggerUpgradeAll = async (nodes: IElasticNode[], clusterId: string) => {
	try {
		const clusterInfo = await getClusterInfoById(clusterId);
		const pathToKey = clusterInfo.pathToKey ? clusterInfo.pathToKey : "";

		await ansibleExecutionManager.createAnsibleInventory(nodes, pathToKey);
		if (!clusterInfo.targetVersion || !clusterInfo.elastic.username || !clusterInfo.elastic.password) {
			return false;
		}

		ansibleExecutionManager
			.runPlaybook("playbooks/main.yml", "ansible_inventory.ini", {
				elk_version: clusterInfo.targetVersion,
				username: clusterInfo.elastic.username,
				password: clusterInfo.elastic.password,
			})
			.catch((error) => {
				logger.error(`Error executing Ansible playbook: ${error.message}`);
			});
	} catch (error: any) {
		logger.error(`Error performing upgrade for nodes:  ${nodes} because of ${error.message}`);
		throw new Error(`Error performing upgrade for nodes:  ${nodes}`);
	}
};

/// /upgrade (exec)

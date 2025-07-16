import logger from "../logger/logger";
import {
	ClusterNode,
	ClusterNodeType,
	IClusterNode,
	IClusterNodeDocument,
	IElasticNode,
	IKibanaNode,
} from "../models/cluster-node.model";

import { NodeStatus } from "../enums";
import { clusterUpgradeJobService } from "./cluster-upgrade-job.service";
import { KibanaClient } from "../clients/kibana.client";
import { syncElasticNodesData } from "./sync.service";

export interface KibanaConfig {
	name: string;
	ip: string;
}

/**
 * @deprecated This function is deprecated and may be removed in future releases.
 */
export const createKibanaNodes = async (kibanaConfigs: KibanaConfig[], clusterId: string): Promise<void> => {
	const kibanaClient = await KibanaClient.buildClient(clusterId);
	ClusterNode.collection.deleteMany({ clusterID: clusterId, type: ClusterNodeType.KIBANA });
	for (const kibanaConfig of kibanaConfigs) {
		try {
			const { version, os, roles } = await kibanaClient.getKibanaNodeDetails(kibanaConfig.ip);
			const nodeId = `node-${kibanaConfig.ip}`;
			const progress = 0;
			const status: NodeStatus = NodeStatus.AVAILABLE;
			const kibanaNode: IKibanaNode = {
				nodeId,
				clusterId,
				name: kibanaConfig.name,
				version,
				ip: kibanaConfig.ip,
				roles,
				os,
				progress,
				status,
				type: ClusterNodeType.KIBANA,
				rank: 0,
			};

			try {
				const clusterUpgradeJob =
					await clusterUpgradeJobService.getActiveClusterUpgradeJobByClusterId(clusterId);
				if (clusterUpgradeJob.targetVersion === version) {
					kibanaNode.status = NodeStatus.UPGRADED;
					kibanaNode.progress = 100;
				}
			} catch (error) {
				logger.debug(`No active upgrade job found:`, error);
			}
			await ClusterNode.findOneAndUpdate(
				{ nodeId: kibanaNode.nodeId, type: ClusterNodeType.KIBANA },
				kibanaNode,
				{
					new: true,
					runValidators: true,
					upsert: true,
				}
			);
		} catch (error) {
			console.error(`Error processing Kibana node ${kibanaConfig.ip}:`, error);
		}
	}
};

/**
 * @deprecated This function is deprecated and may be removed in future releases.
 */
export const getAllElasticNodes = async (clusterId: string): Promise<IElasticNode[]> => {
	try {
		await syncElasticNodesData(clusterId);
	} catch (error) {
		logger.error("Unable to sync with Elastic search instance! Maybe the connection is breaked");
	} finally {
		return (await clusterNodeService.getNodes(clusterId, ClusterNodeType.ELASTIC)) as IElasticNode[];
	}
};

class ClusterNodeService {
	async getNodes(clusterId: string, type?: ClusterNodeType): Promise<IClusterNode[]> {
		const query: any = { clusterId: clusterId };
		if (type != null) {
			query.type = type;
		}
		return await ClusterNode.find(query).sort({ rank: 1 });
	}

	async getElasticNodeById(nodeId: string): Promise<IElasticNode | null> {
		const node = await this.getNodeById(nodeId, ClusterNodeType.ELASTIC);
		return (node as IElasticNode) || null;
	}

	async getKibanaNodeById(nodeId: string): Promise<IKibanaNode | null> {
		const node = await this.getNodeById(nodeId, ClusterNodeType.KIBANA);
		return (node as IKibanaNode) || null;
	}

	async updateNodesPartially(identifier: Partial<IClusterNode>, updates: Partial<IClusterNode>) {
		try {
			await ClusterNode.updateMany(identifier, { $set: updates });
		} catch (error) {
			logger.debug(`Error updating nodes with identifier ${JSON.stringify(identifier)}:`, error);
		}
	}

	async createOrUpdateNode(node: IClusterNode): Promise<IClusterNodeDocument> {
		return await ClusterNode.findOneAndUpdate({ nodeId: node.nodeId }, node, {
			new: true,
			upsert: true,
			runValidators: true,
		});
	}

	async isClusterNodesUpgraded(clusterId: string, targetVersion: string): Promise<boolean> {
		const nodes = await this.getNodes(clusterId);
		const isUpgraded = nodes
			.map((node) => node.status === NodeStatus.UPGRADED && targetVersion === node.version)
			.reduce((acc, curr) => acc && curr, true);
		return isUpgraded;
	}

	private async getNodeById(nodeId: string, type: ClusterNodeType): Promise<IClusterNode | null> {
		return await ClusterNode.findOne({ nodeId: nodeId });
	}
}

export const clusterNodeService = new ClusterNodeService();

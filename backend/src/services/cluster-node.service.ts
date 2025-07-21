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
import { generateHash } from "../utils/hash-utils";

export interface AddKibanaNodeRequest {
	name: string;
	ip: string;
	clusterId: string;
}

class ClusterNodeService {
	async getNodes(clusterId: string, type?: ClusterNodeType): Promise<IClusterNode[]> {
		const query: any = { clusterId: clusterId };
		if (type != null) {
			query.type = type;
		}
		return await ClusterNode.find(query).sort({ rank: 1 });
	}

	async getElasticNodes(clusterId: string): Promise<IElasticNode[]> {
		return (await this.getNodes(clusterId, ClusterNodeType.ELASTIC)) as IElasticNode[];
	}

	async getKibanaNodes(clusterId: string): Promise<IKibanaNode[]> {
		return (await this.getNodes(clusterId, ClusterNodeType.KIBANA)) as IKibanaNode[];
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

	async createOrUpdateKibanaNodes(addKibanaNodeRequests: AddKibanaNodeRequest[]) {
		await Promise.all(addKibanaNodeRequests.map(this.createOrUpdateKibanaNode));
	}

	async createOrUpdateKibanaNode(addKibanaNodeRequest: AddKibanaNodeRequest) {
		const { ip, name, clusterId } = addKibanaNodeRequest;
		const kibanaClient = await KibanaClient.buildClient(clusterId);
		try {
			const { version, os, roles } = await kibanaClient.getKibanaNodeDetails(ip);
			const nodeId = generateHash(`${clusterId}-kb-${ip}`);
			const progress = 0;
			const status: NodeStatus = NodeStatus.AVAILABLE;
			const kibanaNode: IKibanaNode = {
				nodeId,
				clusterId,
				name: name,
				version,
				ip: ip,
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
			logger.error(`Error processing Kibana node ${addKibanaNodeRequest.ip}:`, error);
		}
	}

	async isClusterNodesUpgraded(clusterId: string, targetVersion: string): Promise<boolean> {
		const nodes = await this.getNodes(clusterId);
		const isUpgraded = nodes
			.map((node) => node.status === NodeStatus.UPGRADED && targetVersion === node.version)
			.reduce((acc, curr) => acc && curr, true);
		return isUpgraded;
	}

	private async getNodeById(nodeId: string, type: ClusterNodeType): Promise<IClusterNode | null> {
		return await ClusterNode.findOne({ nodeId: nodeId, type: type });
	}
}

export const clusterNodeService = new ClusterNodeService();

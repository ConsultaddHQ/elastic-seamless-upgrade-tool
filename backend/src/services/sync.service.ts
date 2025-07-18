import { ClusterNodeType, IElasticNode } from "../models/cluster-node.model";
import { KibanaClient } from "../clients/kibana.client";
import logger from "../logger/logger";
import { clusterStatus, NodeStatus } from "../enums";
import { ElasticClient } from "../clients/elastic.client";
import { createOrUpdateElasticSearchInfo, IElasticSearchInfo } from "./elastic-search-info.service";
import { clusterUpgradeJobService } from "./cluster-upgrade-job.service";
import { ClusterUpgradeJobStatus } from "../models/cluster-upgrade-job.model";
import { clusterNodeService } from "./cluster-node.service";
import { getNodeRankByRoles } from "../utils/role-utils";

export const syncKibanaNodes = async (clusterId: string) => {
	try {
		const kibanaClient = await KibanaClient.buildClient(clusterId);
		const kibanaNodes = await clusterNodeService.getNodes(clusterId, ClusterNodeType.KIBANA);
		for (const kibanaNode of kibanaNodes) {
			const { version } = await kibanaClient.getKibanaNodeDetails(kibanaNode.ip);
			clusterNodeService.updateNodesPartially(
				{ nodeId: kibanaNode.nodeId, type: ClusterNodeType.KIBANA },
				{
					version: version,
				}
			);
		}
	} catch (error: any) {
		logger.debug(`Error syncing Kibana nodes for cluster ${clusterId}:`, error.message);
	}
};

export const syncElasticSearchInfo = async (clusterId: string) => {
	try {
		const client = await ElasticClient.buildClient(clusterId);
		const clusterDetails = await client.getClient().info();
		const indicesResponse = await client.getClient().cat.indices({ format: "json" });
		const healthDetails = await client.getClient().cluster.health();
		const setting = await client.getSetting();
		const adaptiveReplicaEnabled =
			setting.transient?.["search.adaptive_replica_selection"] ??
			setting.persistent?.["search.adaptive_replica_selection"] ??
			setting.defaults?.["search.adaptive_replica_selection"];

		const masterNodes = await client.getMasterNodes();
		const elasticSearchInfo: IElasticSearchInfo = {
			clusterName: clusterDetails?.cluster_name ?? null,
			clusterUUID: clusterDetails?.cluster_uuid ?? null,
			status: healthDetails.status as clusterStatus,
			version: clusterDetails.version.number,
			timedOut: healthDetails?.timed_out,
			numberOfDataNodes: healthDetails?.number_of_data_nodes ?? null,
			numberOfMasterNodes: masterNodes.length,
			numberOfNodes: healthDetails?.number_of_nodes ?? null,
			activePrimaryShards: healthDetails?.active_primary_shards ?? null,
			activeShards: healthDetails?.active_shards ?? null,
			unassignedShards: healthDetails?.unassigned_shards ?? null,
			initializingShards: healthDetails?.initializing_shards ?? null,
			relocatingShards: healthDetails?.relocating_shards ?? null,
			clusterId: clusterId,
			adaptiveReplicationEnabled: adaptiveReplicaEnabled,
			totalIndices: indicesResponse.length,
			lastSyncedAt: new Date(),
			currentMasterNode: masterNodes.filter((node) => node).map((node) => `${node.node}/${node.id}`)[0],
		};
		await createOrUpdateElasticSearchInfo(elasticSearchInfo);
	} catch (err) {
		throw new Error("Unable to sync with Elastic search instance! Maybe the connection is breaked");
	}
};

export const syncClusterUpgradeJobStatus = async (clusterId: string) => {
	try {
		const job = await clusterUpgradeJobService.getActiveClusterUpgradeJobByClusterId(clusterId);
		if (!(job.status === ClusterUpgradeJobStatus.COMPLETED || job.status === ClusterUpgradeJobStatus.FAILED)) {
			const isUpgraded = await clusterNodeService.isClusterNodesUpgraded(clusterId, job.targetVersion);
			if (isUpgraded) {
				clusterUpgradeJobService.clusterUpgradeJobCompleted(job.jobId);
			}
		}
	} catch (error) {
		logger.debug(`No active upgrade job found for cluster ${clusterId}:`, error);
	}
};

export const syncElasticNodesData = async (clusterId: string) => {
	try {
		const client = await ElasticClient.buildClient(clusterId);
		const response: any = await client.getClient().nodes.info({
			filter_path: "nodes.*.name,nodes.*.roles,nodes.*.os.name,nodes.*.os.version,nodes.*.version,nodes.*.ip",
		});
		const masterNodes = await client.getMasterNodes();
		const elasticNodes: IElasticNode[] = Object.entries(response.nodes).map(([key, value]: [string, any]) => ({
			nodeId: key,
			clusterId: clusterId,
			ip: value.ip,
			name: value.name,
			version: value.version,
			roles: value.roles,
			os: value.os,
			progress: 0,
			isMaster: masterNodes.some((master) => master.id === key),
			status: NodeStatus.AVAILABLE,
			type: ClusterNodeType.ELASTIC,
			rank: getNodeRankByRoles(
				value.roles,
				masterNodes.some((master) => master.id === key)
			),
		}));

		for (const node of elasticNodes) {
			const existingNode = await clusterNodeService.getElasticNodeById(node.nodeId);
			if (existingNode) {
				node.status = existingNode.status;
				node.progress = existingNode.progress;
			}
			await clusterNodeService.createOrUpdateNode(node);
		}
	} catch (error) {
		logger.error("Error syncing nodes from Elasticsearch:", error);
	}
};

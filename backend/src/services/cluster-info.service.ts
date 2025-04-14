import { ElasticClient } from "../clients/elastic.client";
import { DeprecationCounts, DeprecationSetting } from "../interfaces";
import ClusterInfo, {
	IClusterInfo,
	IClusterInfoDocument,
	IElasticInfo,
	IKibanaInfo,
} from "../models/cluster-info.model";
import { MigrationDeprecationsDeprecation } from "@elastic/elasticsearch/lib/api/types";
import { DeprecationDetail, KibanaClient } from "../clients/kibana.client";
import { ElasticClusterBaseRequest } from "..";

const cache: Record<string, IClusterInfo | null> = {};

export const createOrUpdateClusterInfo = async (clusterInfo: IClusterInfo): Promise<IClusterInfoDocument> => {
	// TODO These needs to be updated when we want to support multiple clusters
	const clusterId = "cluster-id"; //clusterInfo.clusterId
	const {
		elastic,
		kibana,
		certificateIds,
		targetVersion,
		infrastructureType,
		pathToKey,
		key,
		kibanaConfigs,
		sshUser,
	} = clusterInfo;
	const data = await ClusterInfo.findOneAndUpdate(
		{ clusterId: clusterId },
		{
			elastic: elastic,
			kibana: kibana,
			certificateIds: certificateIds,
			clusterId: clusterId,
			targetVersion: targetVersion,
			infrastructureType: infrastructureType,
			pathToKey: pathToKey,
			key: key,
			kibanaConfigs: kibanaConfigs,
			sshUser: sshUser,
		},
		{ new: true, upsert: true, runValidators: true }
	);
	cache[clusterId] = data;
	return data;
};

export const getAllClusters = async (): Promise<IClusterInfo[]> => {
	try {
		const clusters = await ClusterInfo.find({});
		return clusters.map((cluster) => ({
			clusterId: cluster.clusterId,
			elastic: cluster.elastic,
			kibana: cluster.kibana,
			targetVersion: cluster.targetVersion,
			infrastructureType: cluster.infrastructureType,
			certificateIds: cluster.certificateIds,
			pathToKey: cluster.pathToKey,
			key: cluster.key,
			kibanaConfigs: cluster.kibanaConfigs,
			sshUser: cluster.sshUser,
		}));
	} catch (error) {
		console.error("Error fetching cluster list:", error);
		throw error;
	}
};

export const getClusterInfoById = async (clusterId: string): Promise<IClusterInfo> => {
	// TODO These needs to be updated when we want to support multiple clusters
	clusterId = "cluster-id";

	const clusterInfo = cache[clusterId]
		? cache[clusterId]
		: await ClusterInfo.findOne({
				clusterId: clusterId,
			});
	cache[clusterId] = clusterInfo;
	return {
		clusterId,
		elastic: clusterInfo?.elastic!!,
		kibana: clusterInfo?.kibana!!,
		targetVersion: clusterInfo?.targetVersion,
		infrastructureType: clusterInfo?.infrastructureType,
		certificateIds: clusterInfo?.certificateIds,
		pathToKey: clusterInfo?.pathToKey,
		key: clusterInfo?.key,
		kibanaConfigs: clusterInfo?.kibanaConfigs,
		sshUser: clusterInfo?.sshUser!!,
	};
};

export const getElasticsearchDeprecation = async (
	clusterId: string
): Promise<{
	counts: DeprecationCounts;
	deprecations: DeprecationSetting[];
}> => {
	try {
		const client = await ElasticClient.buildClient(clusterId);
		const data = await client.getClient().migration.deprecations();

		let criticalCount = 0;
		let warningCount = 0;
		let deprecations: DeprecationSetting[] = [];

		if (data.cluster_settings) {
			data.cluster_settings.forEach((item: MigrationDeprecationsDeprecation) => {
				if (item.level === "critical") criticalCount++;
				if (item.level === "warning") warningCount++;
				deprecations.push({
					issue: item.message,
					issueDetails: item.details,
					resolution: item.url,
					type: item.level,
				});
			});
		}
		if (data.node_settings) {
			data.node_settings.forEach((item: MigrationDeprecationsDeprecation) => {
				if (item.level === "critical") criticalCount++;
				if (item.level === "warning") warningCount++;
				deprecations.push({
					issue: item.message,
					issueDetails: item.details,
					resolution: item.url,
					type: item.level,
				});
			});
		}

		if (data.index_settings) {
			Object.values(data.index_settings).forEach((indexArray: any[]) => {
				indexArray.forEach((item: MigrationDeprecationsDeprecation) => {
					if (item.level === "critical") criticalCount++;
					if (item.level === "warning") warningCount++;
					deprecations.push({
						issue: item.message,
						issueDetails: item.details,
						resolution: item.url,
						type: item.level,
					});
				});
			});
		}
		return {
			counts: { critical: criticalCount, warning: warningCount },
			deprecations: deprecations,
		};
	} catch (error) {
		console.error("Error fetching Elasticsearch deprecations:", error);
		throw error;
	}
};

//upgrade after adding kibana client
export const getKibanaDeprecation = async (
	clusterId: string
): Promise<{
	counts: DeprecationCounts;
	deprecations: DeprecationSetting[];
}> => {
	try {
		const client = await KibanaClient.buildClient(clusterId);
		const data: DeprecationDetail[] = await client.getDeprecations();

		let criticalCount = 0;
		let warningCount = 0;
		const deprecations: DeprecationSetting[] = data.map((item: DeprecationDetail) => {
			if (item.level === "critical") criticalCount++;
			if (item.level === "warning") warningCount++;

			return {
				issue: item.title,
				issueDetails: item.message,
				type: item.level,
				resolution: item.correctiveActions.manualSteps,
			};
		});
		return {
			counts: { critical: criticalCount, warning: warningCount },
			deprecations: deprecations,
		};
	} catch (error) {
		console.error("Error fetching kibana deprecations:", error);
		throw error;
	}
};

export const verifyElasticCredentials = async (elastic: IElasticInfo): Promise<boolean> => {
	try {
		const body: ElasticClusterBaseRequest = {
			url: elastic?.url!!,
			ssl: {},
			username: elastic?.username!!,
			password: elastic?.password!!,
		};
		const client = new ElasticClient(body);
		const healthDetails = await client.getClient().cluster.health();
		if (healthDetails.status && typeof healthDetails.number_of_nodes === "number") {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.error("Elasticsearch connection failed:", error);
		return false;
	}
};

export const verifyKibanaCredentials = async (kibana: IKibanaInfo): Promise<boolean> => {
	try {
		const client = new KibanaClient(kibana);
		const version = await client.getKibanaVersion();

		return true;
	} catch (error) {
		console.error("Kibana connection failed:", error);
		return false;
	}
};

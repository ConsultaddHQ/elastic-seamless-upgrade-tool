import { clusterStatus } from "../enums";

export interface IElasticSearchInfo {
	clusterId: string;
	clusterName: string;
	clusterUUID: string;
	status: clusterStatus;
	version: string;
	timedOut: Boolean;
	numberOfDataNodes: number;
	numberOfMasterNodes: number;
	totalIndices: number;
	numberOfNodes: number;
	currentMasterNode: string;
	activePrimaryShards: number;
	activeShards: number;
	unassignedShards: number;
	initializingShards: number;
	relocatingShards: number;
	lastSyncedAt: Date;
	adaptiveReplicationEnabled: boolean;
}

const cached: Record<string, IElasticSearchInfo> = {};

export const createOrUpdateElasticSearchInfo = async (
	elasticSearchInfo: IElasticSearchInfo
): Promise<IElasticSearchInfo> => {
	const clusterId = elasticSearchInfo.clusterId;
	elasticSearchInfo.clusterId = clusterId;
	cached[clusterId] = {
		...elasticSearchInfo,
		lastSyncedAt: new Date(),
	};
	return cached[clusterId];
};

export const getElasticSearchInfo = async (clusterId: string): Promise<IElasticSearchInfo | null> => {
	return cached[clusterId];
};

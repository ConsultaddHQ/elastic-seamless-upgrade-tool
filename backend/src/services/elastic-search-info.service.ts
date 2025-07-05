import ElasticSearchInfo, { IElasticSearchInfo, IElasticSearchInfoDocument } from "../models/elastic-search-info.model";
import logger from "../logger/logger";

export const createOrUpdateElasticSearchInfo = async (
	elasticSearchInfo: IElasticSearchInfo
): Promise<IElasticSearchInfoDocument> => {
	// TODO These needs to be updated when we want to support multiple clusters
	const clusterId = "cluster-id"; //clusterInfo.clusterId
	elasticSearchInfo.clusterId = clusterId;
	const data = await ElasticSearchInfo.findOneAndUpdate(
		{ clusterId: clusterId },
		{
			...elasticSearchInfo,
			lastSyncedAt: new Date(),
		},
		{ new: true, upsert: true, runValidators: true }
	);
	return data;
};

export const getElasticSearchInfo = async (clusterId: string): Promise<IElasticSearchInfoDocument | null> => {
	try {
		const elasticSearchInfo = await ElasticSearchInfo.findOne({ clusterId: clusterId });
		return elasticSearchInfo;
	} catch (err: any) {
		logger.error("Unable to get Elastic search Data from database", err.message);
		throw new Error("Unable to get Elastic search Data from database" + err.message);
	}
};

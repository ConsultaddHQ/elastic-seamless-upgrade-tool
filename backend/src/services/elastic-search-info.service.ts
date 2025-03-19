import { CatHealthHealthRecord } from "@elastic/elasticsearch/lib/api/types";
import { ElasticClient } from "../clients/elastic.client";
import ElasticSearchInfo, { clusterStatus, IElasticSearchInfo, IElasticSearchInfoDocument } from "../models/elastic-search-info.model"
import { getAllElasticNodes } from "./elastic-node.service.";
import { IElasticNode } from "../models/elastic-node.model";
import logger from "../logger/logger";

export const createOrUpdateElasticSearchInfo = async (elasticSearchInfo: IElasticSearchInfo): Promise<IElasticSearchInfoDocument> => {
	// TODO These needs to be updated when we want to support multiple clusters
	const clusterId = "cluster-id" //clusterInfo.clusterId
    elasticSearchInfo.clusterId = clusterId;
	const data = await ElasticSearchInfo.findOneAndUpdate(
		{ clusterId: clusterId },
		{
			...elasticSearchInfo,
            lastSyncedAt: new Date()
		},
		{ new: true, upsert: true, runValidators: true }
	)
	return data
}

export const syncElasticSearchInfo = async (clusterId: string)=> {
    try{
        const client = await ElasticClient.buildClient(clusterId);
        const clusterDetails = await client.getClient().info();
        const healthDetails = await client.getClient().cluster.health();
        const nodes = await getAllElasticNodes(clusterId);
        let underUpgradation = false;
        let upgradeComplete = true;
        nodes.forEach((node: IElasticNode)=>{
            if(node.status !== 'available'){
            underUpgradation = true;
            }
            if(node.status !== 'upgraded'){
                upgradeComplete = false;
            }
        })
        if(upgradeComplete){
            underUpgradation = false;
        }
        const elasticSearchInfo: IElasticSearchInfo = {
            clusterName: clusterDetails?.cluster_name ?? null,
            clusterUUID: clusterDetails?.cluster_uuid ?? null,
            status: healthDetails.status as clusterStatus,
            version: clusterDetails.version.number,
            timedOut: healthDetails?.timed_out,
            numberOfDataNodes: healthDetails?.number_of_data_nodes ?? null,
            numberOfNodes: healthDetails?.number_of_nodes ?? null,
            activePrimaryShards: healthDetails?.active_primary_shards ?? null,
            activeShards: healthDetails?.active_shards ?? null,
            unassignedShards: healthDetails?.unassigned_shards ?? null,
            initializingShards: healthDetails?.initializing_shards ?? null,
            relocatingShards: healthDetails?.relocating_shards ?? null,
            clusterId: clusterId,
            underUpgradation: underUpgradation,
            lastSyncedAt: new Date(),
        }
        await createOrUpdateElasticSearchInfo(elasticSearchInfo);

    }
    catch(err){
        throw new Error("Unable to sync with Elastic search instance! Maybe the connection is breaked")
    }
}

export const getElasticSearchInfo = async (clusterId: string): Promise<IElasticSearchInfoDocument | null> => {
    try{
        const elasticSearchInfo = await ElasticSearchInfo.findOne({ clusterId: clusterId });
        return elasticSearchInfo;
    }
    catch(err: any){
        logger.error("Unable to get Elastic search Data from database" ,err.message)
        throw new Error("Unable to get Elastic search Data from database" + err.message)
    }
}
import { ElasticClusterBaseRequest } from '..';
import { ElasticClient } from '../clients/elastic.client';
import { Request, Response } from 'express';
import { DeprecationCounts, ElasticNode } from '../interfaces';
import fs from 'fs'
import logger from '../logger/logger';
import {
  IClusterInfo,
  IElasticInfo,
  IKibanaInfo,
} from '../models/cluster-info.model';
import {
  createOrUpdateClusterInfo,
  getAllClusters,
  getClusterInfoById,
  getElasticsearchDeprecation,
  getKibanaDeprecation,
} from '../services/cluster-info.service';
import { addLogs, getLogs } from '../services/logs.service';
import {
  getAllElasticNodes,
  getElasticNodeById,
  syncNodeData,
  triggerNodeUpgrade,
  triggerUpgradeAll,
} from '../services/elastic-node.service.';
import cluster from 'cluster';
import { runPlaybookWithLogging } from './ansible-controller';
import { KibanaClient} from '../clients/kibana.client';
import path from 'path';
import {  getPossibleUpgrades } from '../utils/upgrade.versions';
import { normalizeNodeUrl } from '../utils/utlity.functions';
import { IElasticNode } from '../models/elastic-node.model';

export const healthCheck = async (req: Request, res: Response) => {
  try {
    const clusterId = req.params.clusterId;
    const client = await ElasticClient.buildClient(clusterId);
    const health = await client.getClusterhealth();
    res.send(health);
  } catch (err: any) {
    logger.info(err);
    res.status(400).send({ message: err.message });
  }
};

export const getClusterDetails = async (req: Request, res: Response) => {
  try {
    const clusterId = req.params.clusterId;
    const client = await ElasticClient.buildClient(clusterId);
    const clusterDetails = await client.getClient().info();
    const clusterInfo = await getClusterInfoById(clusterId);
    const healtDetails = await client.getClient().cluster.health();
    const currentVersion = clusterDetails.version.number;
    const possibleUpgradeVersions = getPossibleUpgrades(currentVersion);

    const nodes = await getAllElasticNodes(clusterId);
    let underUpgradation = false;

    nodes.forEach((node: IElasticNode)=>{
      if(node.status !== 'available'){
        underUpgradation = true;
      }
    })
    res.send({
      clusterName: clusterDetails.cluster_name,
      clusterUUID: clusterDetails.cluster_uuid,
      status: healtDetails.status,
      version: clusterDetails.version.number,
      timedOut: healtDetails.timed_out,
      numberOfDataNodes: healtDetails.number_of_data_nodes,
      numberOfNodes: healtDetails.number_of_nodes,
      activePrimaryShards: healtDetails.active_primary_shards,
      activeShards: healtDetails.unassigned_shards,
      unassignedShards: healtDetails.unassigned_shards,
      initializingShards: healtDetails.initializing_shards,
      relocatingShards: healtDetails.relocating_shards,
      infrastructureType: clusterInfo.infrastructureType,
      targetVersion: clusterInfo.targetVersion,
      possibleUpgradeVersions: possibleUpgradeVersions,
      underUpgradation: underUpgradation
    });
    return;
  } catch (err: any) {
    logger.info(err);
    res.status(400).send({ message: err.message });
  }
};

export const addOrUpdateClusterDetail = async (req: Request, res: Response) => {
  try {
    const clusterId = 'cluster-id';
    const elastic: IElasticInfo = req.body.elastic;
    const kibana: IKibanaInfo = req.body.kibana;
    const clusterInfo: IClusterInfo = {
      elastic: {
        ...elastic,
        url: normalizeNodeUrl(elastic.url)
      },
      kibana: {
        ...kibana,
        url: normalizeNodeUrl(kibana.url)
      },
      clusterId: clusterId,
      certificateIds: req.body.certificateIds,
      targetVersion: req.body.targetVersion,
      infrastructureType: req.body.infrastructureType,
      pathToKey: req.body.pathToKey
    };

    const result = await createOrUpdateClusterInfo(clusterInfo);
    res
      .send({
        message: result.isNew ? 'Cluster info saved' : 'Cluster info updated',
        clusterId: result.clusterId,
      })
      .status(201);
    await syncNodeData(clusterId);
  } catch (err: any) {
    logger.info(err);
    res.status(400).send({ message: err.message });
  }
};

export const getUpgradeDetails = async (req: Request, res: Response) => {
  try {
    const clusterId = req.params.clusterId;
    const client = await ElasticClient.buildClient(clusterId);
    const kibanaClient = await KibanaClient.buildClient(clusterId);
    const clusterInfo = await getClusterInfoById(clusterId);
    const kibanaUrl = clusterInfo.kibana?.url;
    const snapshots = await client.getValidSnapshots();

    const esDeprecationCount = (await getElasticsearchDeprecation(clusterId))
      .counts;
    const kibanaDeprecationCount = (await getKibanaDeprecation(clusterId))
      .counts;

    const kibanaVersion = await kibanaClient.getKibanaVersion();
    
    const isKibanaUpgraded = (kibanaVersion === clusterInfo.targetVersion) ? true : false
    //verifying upgradability
    const elasticNodes = (await getAllElasticNodes(clusterId)).filter(
      (item) => item.status !== 'completed',
    );
    const isESUpgraded = elasticNodes.length === 0;
    res.send({
      elastic: {
        isUpgradable: !isESUpgraded,
        deprecations: { ...esDeprecationCount },
        snapshot: {
          snapshot: snapshots.length > 0 ? snapshots[0] : null,
          creationPage: `${kibanaUrl}/app/management/data/snapshot_restore/snapshots`
        }
      },
      kibana: {
        isUpgradable: !isKibanaUpgraded,
        deprecations: { ...kibanaDeprecationCount },
      },
    });
  } catch (error: any) {
    res.status(501).json({ err: error.message });
  }
};

export const getElasticDeprecationInfo = async (
  req: Request,
  res: Response,
) => {
  try {
    const clusterId = req.params.clusterId;
    const deprecations = (await getElasticsearchDeprecation(clusterId))
      .deprecations;

    // const upgradeInfo = await client
    //   .getClient()
    //   .migration.getFeatureUpgradeStatus();
    // logger.info('upgrade Info', upgradeInfo);    //need to discuss what if feature upgrades are present
    res.status(200).send(deprecations);
  } catch (err: any) {
    logger.info(err);
    res.status(400).send({ message: err.message });
  }
};

export const getNodesInfo = async (req: Request, res: Response) => {
  try {
    const clusterId = req.params.clusterId;
    const elasticNodes = await getAllElasticNodes(clusterId);
    const nodes = elasticNodes.map((node) => {
      if (node.isMaster) {
        return {
          nodeId: node.nodeId,
          clusterId: node.clusterId,
          name: node.name,
          version: node.version,
          ip: node.ip,
          roles: ['master'],
          os: node.os,
          isMaster: node.isMaster,
          status: node.status,
          progress: node.progress,
        };
      }
      if (node.roles.includes('data')) {
        return {
          nodeId: node.nodeId,
          clusterId: node.clusterId,
          name: node.name,
          version: node.version,
          ip: node.ip,
          roles: ['data'],
          os: node.os,
          isMaster: node.isMaster,
          status: node.status,
          progress: node.progress,
        };
      }
    });
    res.send(nodes);
  } catch (error: any) {
    logger.error('Error fetching node details:', error);
    res.status(400).send({ message: error.message });
  }
};

export const handleUpgrades = async (req: Request, res: Response) => {
  const clusterId = req.params.clusterId;
  const { nodes } = req.body;
  try {
    nodes.forEach((nodeId: string) => {
      const triggered = triggerNodeUpgrade(nodeId,clusterId);
      if (!triggered) {
        res.status(400).send({ message: 'Upgrade failed node not available' });
      }
      else{
        return;
      }
    });
    res.status(200).send({ message: 'Upgradation triggered' });
  } catch (err: any) {
    logger.error('Error performing upgrade:', err);
    res.status(400).send({ message: err.message });
  }
};

export const handleUpgradeAll = async(req: Request, res: Response)=>{
  try{
    const clusterId = req.params.clusterId;
    await triggerUpgradeAll(clusterId);
    res.json({
      message: "Check inventory"
    })
  }
  catch(error){
    res.json({
      message: "error"
    })
  }
}


export const getLogsStream = async (req: Request, res: Response) => {
  const { clusterId, nodeId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let lastTimestamp: Date | undefined = undefined;

  const intervalId = setInterval(async () => {
    // Uncomment this code block to create fack stream logs in db
    // addLogs(
    //   clusterId,
    //   nodeId,
    //   new Date(),
    //   `data: ${JSON.stringify({
    //     timestamp: new Date(),
    //     message: 'Upgrade in progress',
    //   })}`,
    // );

    const logs = await getLogs(clusterId, nodeId, lastTimestamp);
    for (let log of logs) {
      res.write(`${log.message}\n`);
      lastTimestamp = log.timestamp;
    }
  }, 2000);

  // Cleanup when the client disconnects
  req.on('close', () => {
    logger.debug('Client disconnected');
    clearInterval(intervalId);
    res.end();
  });
};

export const getKibanaDeprecationsInfo = async (
  req: Request,
  res: Response,
) => {
  try {
    const clusterId = req.params.clusterId;
    const deprecations = (await getKibanaDeprecation(clusterId)).deprecations;
    res.send(deprecations);
  } catch (error: any) {
    logger.error(error);
    res.status(400).send({ message: error.message });
  }
};

export const getValidSnapshots = async (req: Request, res: Response) => {
  try {
    const { clusterId } = req.params;
    const client = await ElasticClient.buildClient(clusterId);
    const snapshots = await client.getValidSnapshots();
    res.send(snapshots);
  } catch (error: any) {
    logger.error('Error fetching node details:', error);
    res.status(400).send({ message: error.message });
  }
};

export const uploadCertificates = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const fileIds = files.map((file: Express.Multer.File) => file.filename);
    res.status(200).json({ certificateIds: fileIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
};

export const getNodeInfo = async (req: Request, res: Response) => {
  const { clusterId, nodeId } = req.params;

  try {
    const data = await getElasticNodeById(nodeId);
    res.send(data);
  } catch (error: any) {
    logger.error('Error fetching node details:', error);
    res.status(400).send({ message: error.message });
  }
};


export const addOrUpdateTargetVersion = async (req: Request, res: Response) => {
  const { clusterId } = req.params;
  const { version } = req.body;
  try {
    const clusterInfo = await getClusterInfoById(clusterId);
    await createOrUpdateClusterInfo({ ...clusterInfo, targetVersion: version });
    res.status(201).send({
      message: `Target version set succesfully`
    })
  }
  catch (error: any) {
    logger.error("Unable to add target version: ", error);
    res.status(500).send({ message: error.message })
  }

}

export const verfiySshKey = async (req: Request, res: Response) => {
  const { pathToKey} = req.body;
  try {

    if (!pathToKey) {
      res.status(400).send({ success: false, message: 'SSH key path is required.' });
    }

    const resolvedPath = path.resolve(pathToKey);

    if (!fs.existsSync(resolvedPath)) {
      res.status(400).json({ success: false, message: 'mentioned path to key, does not exist' });
      return;
    }

    const fileContent = fs.readFileSync(resolvedPath, 'utf8');

    if (!fileContent.startsWith('-----BEGIN ') || !fileContent.includes('PRIVATE KEY-----')) {
      res.status(400).send({ success: false, message: 'Invalid SSH private key format.' });
      return;
    }

    res.send({ success: true, message: 'SSH key is valid.' });
    return;

  } catch (error) {
    console.error('Error verifying SSH key:', error);
    res.status(500).json({ success: false, message: 'Error verifying ssh key please contact owner' });
  }
}

export const verfiyCluster = async(req: Request,res: Response)=>{

  try{
      const clusters = await getAllClusters();
      if(clusters.length > 0){
        res.send({
          clusterAvailable: true
        })
      }
      else{
        res.send({
          clusterAvailable: false
        })
      }
  }
  catch(error : any){
    logger.error('Unable to fetch cluster availibility info',error.message)
    res.status(501).send({
      message: 'Unable to fetch cluster availibility info'
    })
  }
} 


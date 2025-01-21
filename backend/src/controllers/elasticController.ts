import { exec } from 'child_process';
import { ElasticClusterBaseRequest, ElasticClusterHealthRequest } from '..';
import { ElasticClient } from '../clients/elastic';
import { Request, Response } from 'express';
import { ElasticNode } from '../interfaces';
import fs from "fs";
import { createAnsibleInventory, executeAnsiblePlaybook } from './ansibleController';
import { CatMasterMasterRecord, CatMasterResponse } from '@elastic/elasticsearch/lib/api/types';
import logger from '../logger/logger';
// import { DateTime } from 'luxon';

export const healthCheck = async (req: Request, res: Response) => {
  try {
    const body: ElasticClusterBaseRequest = req.body;
    const client = new ElasticClient(body);
    const health = await client.getClusterhealth();

    res.send(health);
  } catch (err: any) {
    logger.info(err);
    res.status(400).send({ message: err.message });
  }
};

export const getClusterDetails = async (req: Request, res: Response) => {
  try {
    const body: ElasticClusterBaseRequest = req.body;
    const client = new ElasticClient(body);
    const clusterDetails = await client.getClient().info();
    const healtDetails = await client.getClient().cluster.health();

    res.send({
      ...healtDetails,
      ...clusterDetails,
    });
  } catch (err: any) {
    logger.info(err);
    res.status(400).send({ message: err.message });
  }
};

async function verifySnapshotForAllRepositories(req: Request, res: Response) {
  try {
    const body: ElasticClusterBaseRequest = req.body;
    const client = new ElasticClient(body);

    const repositoriesResponse = await client
      .getClient()
      .snapshot.getRepository({});
    const repositories = Object.keys(repositoriesResponse.body);

    if (repositories.length === 0) {
      logger.info('No repositories found.');
      return;
    }

    for (const repository of repositories) {
      logger.info(`Checking snapshots for repository: ${repository}`);
      const snapshotResponse = await client.getClient().snapshot.get({
        repository,
        snapshot: '_all',
      });
      logger.info(snapshotResponse);
      const snapshots: any = snapshotResponse.snapshots;

      if (snapshots.length === 0) {
        logger.info(`No snapshots found in repository ${repository}.`);
        continue;
      }

      const latestSnapshot = snapshots.sort((a: any, b: any) => {
        return (
          new Date(b.start_time_in_millis).getTime() -
          new Date(a.start_time_in_millis).getTime()
        );
      })[0];

      //   const snapshotTimestamp = latestSnapshot.start_time_in_millis;
      //   const snapshotDate = new Date(snapshotTimestamp);
      //   const currentDate =  new Date(Date.now())

      //   const hoursDifference = (currentDate: any - snapshotDate)

      //   if (hoursDifference <= 24) {
      //     logger.info(`The latest snapshot in repository ${repository} was taken within the last 24 hours.`);
      //   } else {
      //     logger.info(`The latest snapshot in repository ${repository} was NOT taken within the last 24 hours.`);
      //   }
    }
  } catch (error) {
    logger.error('Error checking snapshot details:', error);
  }
}

export const getDepriciationInfo = async (req: Request, res: Response) => {
  try {
    const body: ElasticClusterBaseRequest = req.body;
    const client = new ElasticClient(body);
    const depriciationInfo = await client.getClient().migration.deprecations();
    const upgradeInfo = await client
      .getClient()
      .migration.getFeatureUpgradeStatus();
    logger.info('upgrade Info', upgradeInfo);
    res.send(depriciationInfo).status(201);
  } catch (err: any) {
    logger.info(err);
    res.status(400).send({ message: err.message });
  }
};

export const getNodesInfo = async (req: Request, res: Response) => {
  try {
    const body: ElasticClusterBaseRequest = req.body;
    const client = new ElasticClient(body);

    const response: any = await client.getClient().nodes.info({
      filter_path:
        'nodes.*.name,nodes.*.roles,nodes.*.os.name,nodes.*.os.version,nodes.*.version,nodes.*.ip',
    });
    const masterNode: any= await client.getClient().cat.master({
      format: "json"
    });
    console.log('masterNode',masterNode);
    const elasticNodes: ElasticNode[] | null = Object.entries(
      response.nodes,
    ).map(([key, value]: any) => ({
      id: key,
      ip: value.ip,
      name: value.name,
      version: value.version,
      roles: value.roles,
      os: value.os,
      isMaster: (masterNode[0].id === key)
    }));
      //Edit this info according to need
    // logger.info('Node details:', response);
  //  createAnsibleInventory(elasticNodes, './HF-AWX-key.pem');
  //  executeAnsiblePlaybook('ansible_inventory.ini','8.6.1','ansible/main',"elastic","B6T5WucTp=sJfbbPLErj")
   res.send(elasticNodes);
   
    
  } catch (error) {
    logger.error('Error fetching node details:', error);
  }
};


export const performUpgrade = async (req: Request, res: Response) => {
  
};
// export const getUpgradeDetails

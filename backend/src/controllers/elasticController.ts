import { exec } from 'child_process';
import { ElasticClusterBaseRequest, ElasticClusterHealthRequest } from '..';
import { ElasticClient } from '../clients/elastic';
import { Request, Response } from 'express';
import { ElasticNode } from '../interfaces';
import fs from "fs";
// import { DateTime } from 'luxon';

export const healthCheck = async (req: Request, res: Response) => {
  try {
    const body: ElasticClusterBaseRequest = req.body;
    const client = new ElasticClient(body);
    const health = await client.getClusterhealth();
    const h = await client.getClient();
    console.log(await h.cluster.health());
    res.send(health);
  } catch (err: any) {
    console.log(err);
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
      relocatingShards: healtDetails.relocating_shards
    }
);
  } catch (err: any) {
    console.log(err);
    res.status(400).send({ message: err.message });
  }
};
// Luxon for handling date/time calculations

async function verifySnapshotForAllRepositories(req: Request, res: Response) {
  try {
    const body: ElasticClusterBaseRequest = req.body;
    const client = new ElasticClient(body);

    const repositoriesResponse = await client
      .getClient()
      .snapshot.getRepository({});
    const repositories = Object.keys(repositoriesResponse.body);

    if (repositories.length === 0) {
      console.log('No repositories found.');
      return;
    }

    for (const repository of repositories) {
      console.log(`Checking snapshots for repository: ${repository}`);
      const snapshotResponse = await client.getClient().snapshot.get({
        repository,
        snapshot: '_all',
      });
      console.log(snapshotResponse);
      const snapshots: any = snapshotResponse.snapshots;

      if (snapshots.length === 0) {
        console.log(`No snapshots found in repository ${repository}.`);
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
      //     console.log(`The latest snapshot in repository ${repository} was taken within the last 24 hours.`);
      //   } else {
      //     console.log(`The latest snapshot in repository ${repository} was NOT taken within the last 24 hours.`);
      //   }
    }
  } catch (error) {
    console.error('Error checking snapshot details:', error);
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
    console.log('upgrade Info', upgradeInfo);
    res.send(depriciationInfo).status(201);
  } catch (err: any) {
    console.log(err);
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

    const elasticNodes: ElasticNode[] | null = Object.entries(
      response.nodes,
    ).map(([key, value]: any) => ({
      id: key,
      ip: value.ip,
      name: value.name,
      version: value.version,
      roles: value.roles,
      os: value.os,
    }));

    //Edit this info according to need
    // console.log('Node details:', response);
    createAnsibleInventory(elasticNodes);
   
    
    res.send(elasticNodes);
  } catch (error) {
    console.error('Error fetching node details:', error);
  }
};

const createAnsibleInventory = async (nodes: ElasticNode[]) => {
  try {
    const rolePriority = ['master', 'master_eligible', 'data', 'ml'];

    // Initialize inventory groups based on the priority
    const inventory: Record<string, string[]> = {};
    rolePriority.forEach((role) => (inventory[role] = []));

    // Iterate through nodes and assign to the highest-priority role
    for (const node of nodes) {
      for (const role of rolePriority) {
        if (node.roles.includes(role)) {
          inventory[role].push(node.ip); // Use node.name for inventory
          break; // Stop once assigned to the highest-priority role
        }
      }
    }

    const ansibleInventory = Object.entries(inventory)
    .filter(([, nodes]) => nodes.length > 0) // Include only non-empty groups
    .map(([role, nodes]) => `[${role}]\n${nodes.join("\n")}`)
    .join("\n\n");
    console.log(ansibleInventory);

    fs.writeFileSync("ansible_inventory.ini", ansibleInventory);
    console.log("Ansible inventory created: ansible_inventory.ini");


  } catch (error) {
    console.error('Error creating Ansible inventory:', error);
  }
};
export const performUpgrade = async (req: Request, res: Response) => {};
// export const getUpgradeDetails

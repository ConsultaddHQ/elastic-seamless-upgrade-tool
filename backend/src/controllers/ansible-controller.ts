import { exec } from 'child_process';
import { ElasticNode } from '../interfaces';
// import { ExecResult, Playbook} from 'node-ansible';
import fs from 'fs';
import path from 'path';
import logger from '../logger/logger';
import { Readable } from 'stream';
import { ExecResult } from '../types/node-ansible';
import {
  updateNodeProgress,
  updateNodeStatus,
} from '../services/elastic-node.service.';
import { taskProgressMap, taskProgressMapKibana } from '../utils/tasks.info';
import { IElasticNode } from '../models/elastic-node.model';
import { IKibanaNode } from '../models/kibana-node.model';
import {syncKibanaNodes, updateKibanaNodeProgress, updateKibanaNodeStatus} from "../services/kibana-node.service";

export const createAnsibleInventory = async (
  nodes: IElasticNode[],
  pathToKey: string,
) => {
  try {
    const roleGroups: Record<
      'elasticsearch_master' | 'elasticsearch_data',
      string[]
    > = {
      elasticsearch_master: [],
      elasticsearch_data: [],
    };
    
    for (const node of nodes) {
      console.log(node);
      if (node.isMaster === true) {
        roleGroups.elasticsearch_master.push(
          `${node.name} ansible_host=${node.ip}`,
        );
        continue;
      }
      if (node.roles.includes('data')) {
        roleGroups.elasticsearch_data.push(
          `${node.name} ansible_host=${node.ip}`,
        );
      }
    }

    const inventoryParts: string[] = [];

    // Only add groups that have hosts
    Object.entries(roleGroups).forEach(([group, hosts]) => {
      if (hosts.length > 0) {
        inventoryParts.push(`[${group}]\n${hosts.join('\n')}`);
      }
    });

    // Only include non-empty groups in elasticsearch:children
    const nonEmptyGroups = Object.entries(roleGroups)
      .filter(([_, hosts]) => hosts.length > 0)
      .map(([group]) => group);

    if (nonEmptyGroups.length > 0) {
      inventoryParts.push(
        `[elasticsearch:children]\n${nonEmptyGroups.join('\n')}`,
      );
    }

    inventoryParts.push(
      `[elasticsearch:vars]\nansible_ssh_user=ubuntu\nansible_ssh_private_key_file=${pathToKey}\nansible_ssh_common_args='-o StrictHostKeyChecking=no'`,
    );

    const inventoryContent = inventoryParts.join('\n\n');

    await fs.promises.writeFile(
      'ansible_inventory.ini',
      inventoryContent,
      'utf8',
    );

    return inventoryContent;
  } catch (error) {
    console.error('Error creating Ansible inventory:', error);
    throw error;
  }
};
/**
 * Executes an Ansible playbook using node-ansible.
 *
 * @param inventoryPath - Path to the inventory file.
 * @param elkVersion - Version of ELK to use as an extra variable.
 * @param playbookName - Name of the playbook file to execute.
 * @param variables - vars required by playbook
 * @returns A Promise that resolves with the logs generated by the playbook execution.
 */
export const runPlaybookWithLogging = async (
  playbookPath: string,
  inventoryPath: string,
  variables: {
    elk_version: string;
    username: string;
    password: string;
    [key: string]: string; // To allow additional variables
  },
  nodeId: string,
): Promise<ExecResult> => {
  try {
    logger.info(`Starting playbook for node: ${nodeId}`);

    let currentProgress = 0;

    const extraVars = Object.entries(variables)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    const command = `ansible-playbook -i ${inventoryPath} -e "${extraVars}" ${playbookPath} -vvv`; ////command
    console.log('command', command);
    return new Promise<ExecResult>((resolve, reject) => {
      const childProcess = exec(command);
      updateNodeStatus(nodeId, 'upgrading');
      updateNodeProgress(nodeId, 0);
      const stdout: string[] = [];
      const stderr: string[] = [];

      childProcess.stdout?.on('data', (data) => {
        const chunk = data.toString();
        stdout.push(chunk);
        // logger.info(`[${nodeId}] STDOUT: ${chunk}`);
        const taskMatch = chunk.match(/TASK \[(.+?)\]/);
        if (taskMatch && taskMatch.length >= 1) {
          const taskName = taskMatch[1].trim();
          console.log('taskNameith', taskName);
          if (taskProgressMap[taskName] !== undefined) {
            currentProgress = currentProgress + taskProgressMap[taskName];
            updateNodeProgress(nodeId, currentProgress);
          }
        }
      });

      childProcess.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr.push(chunk);
        logger.error(`[${nodeId}] STDERR: ${chunk}`);
      });
      childProcess.on('close', (code) => {
        if (code === 0) {
          logger.info(`[${nodeId}] Playbook executed successfully.`);
          updateNodeProgress(nodeId, 100);
          updateNodeStatus(nodeId, 'upgraded');
          resolve({
            code: 0,
            stdout: Readable.from(stdout.join('')),
            stderr: Readable.from(stderr.join('')),
          });
        } else {
          const errorMessage = stderr.join('');
          updateNodeStatus(nodeId, 'failed');
          logger.error(
            `[${nodeId}] Playbook failed with exit code ${code}. Error: ${errorMessage}`,
          );
          resolve({
            code: code || 1,
            stdout: Readable.from(stdout.join('')),
            stderr: Readable.from(stderr.join('')),
            error: errorMessage,
          });
        }
      });
      childProcess.on('error', (error) => {
        const errorMessage = `Error running playbook for node: ${nodeId}: ${error.message}`;
        updateNodeStatus(nodeId, 'failed');
        logger.error(errorMessage);
        reject({
          code: 1,
          stdout: Readable.from(''),
          stderr: Readable.from(''),
          error: errorMessage,
        });
      });
    });
  } catch (error: any) {
    const errorMessage = `Unexpected error running playbook for node: ${nodeId}: ${error.message}`;
    logger.error(errorMessage);

    return {
      code: 1,
      stdout: Readable.from(''),
      stderr: Readable.from(''),
      error: errorMessage,
    };
  }
};


////////////////////////_-----------------------kibana---------------------////////////////////////
export const createAnsibleInventoryForKibana = async(
  kibanaNodes: IKibanaNode[],
  pathToKey: string
)=>{
  try{
    const roleGroups: Record<'kibana', string[]> = {
      kibana: [],
    };
    const inventoryParts: string[] = [];
    for (const node of kibanaNodes) {
      console.log(node);
      // Add the Kibana node to the kibana group
      roleGroups.kibana.push(`${node.name} ansible_host=${node.ip}`);
    }
    Object.entries(roleGroups).forEach(([group, hosts]) => {
      if (hosts.length > 0) {
        inventoryParts.push(`[${group}]\n${hosts.join('\n')}`);
      }
    });
    inventoryParts.push(
      `[kibana:vars]\nansible_ssh_user=ubuntu\nansible_ssh_private_key_file=${pathToKey}\nansible_ssh_common_args='-o StrictHostKeyChecking=no'`
    );
    const inventoryContent = inventoryParts.join('\n\n');
  
    await fs.promises.writeFile(
      'ansible_inventory.ini',
      inventoryContent,
      'utf8',
    );
    return inventoryContent;    
  }
  catch(error){
    console.error('Error creating Ansible inventory:', error);
    throw new Error(`Error creating Ansible inventory: ${(error as Error).message}`);
  }
}

export const runPlaybookWithLoggingForKibana = async (
  playbookPath: string,
  inventoryPath: string,
  variables: {
    elk_version: string;
    username: string;
    password: string;
    [key: string]: string; // To allow additional variables
  },
  clusterId: string,
  nodeId: string,
): Promise<ExecResult> => {
  try {
    logger.info(`Starting playbook for node: ${nodeId}`);

    let currentProgress = 0;

    const extraVars = Object.entries(variables)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    const command = `ansible-playbook -i ${inventoryPath} -e "${extraVars}" ${playbookPath} -vvv`; ////command
    console.log('command', command);
    return new Promise<ExecResult>((resolve, reject) => {
      const childProcess = exec(command);
      updateKibanaNodeStatus(nodeId, 'upgrading');
      updateKibanaNodeProgress(nodeId, 0);
      const stdout: string[] = [];
      const stderr: string[] = [];

      childProcess.stdout?.on('data', (data) => {
        const chunk = data.toString();
        stdout.push(chunk);
        // logger.info(`[${nodeId}] STDOUT: ${chunk}`);
        const taskMatch = chunk.match(/TASK \[(.+?)\]/);
        if (taskMatch && taskMatch.length >= 1) {
          const taskName = taskMatch[1].trim();
          console.log('taskNameith', taskName);
          if (taskProgressMapKibana[taskName] !== undefined) {
            currentProgress = currentProgress + taskProgressMapKibana[taskName];
            updateKibanaNodeProgress(nodeId, currentProgress);
          }
        }
      });

      childProcess.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr.push(chunk);
        logger.error(`[${nodeId}] STDERR: ${chunk}`);
      });
      childProcess.on('close', async(code) => {
        if (code === 0) {
          logger.info(`[${nodeId}] Playbook executed successfully.`);
          updateKibanaNodeProgress(nodeId, 100);
          try {
            await syncKibanaNodes(clusterId); 
            logger.info(`[${nodeId}] Kibana node data synced successfully.`);
          } catch (syncError: any) {
            logger.error(`[${nodeId}] Failed to sync Kibana node data: ${syncError.message}`);
          }
          updateKibanaNodeStatus(nodeId, 'upgraded');
          resolve({
            code: 0,
            stdout: Readable.from(stdout.join('')),
            stderr: Readable.from(stderr.join('')),
          });
        } else {
          const errorMessage = stderr.join('');
          updateKibanaNodeStatus(nodeId, 'failed');
          logger.error(
            `[${nodeId}] Playbook failed with exit code ${code}. Error: ${errorMessage}`,
          );
          resolve({
            code: code || 1,
            stdout: Readable.from(stdout.join('')),
            stderr: Readable.from(stderr.join('')),
            error: errorMessage,
          });
        }
      });
      childProcess.on('error', (error) => {
        const errorMessage = `Error running playbook for node: ${nodeId}: ${error.message}`;
        updateKibanaNodeStatus(nodeId, 'failed');
        logger.error(errorMessage);
        reject({
          code: 1,
          stdout: Readable.from(''),
          stderr: Readable.from(''),
          error: errorMessage,
        });
      });
    });
  } catch (error: any) {
    const errorMessage = `Unexpected error running playbook for node: ${nodeId}: ${error.message}`;
    logger.error(errorMessage);

    return {
      code: 1,
      stdout: Readable.from(''),
      stderr: Readable.from(''),
      error: errorMessage,
    };
  }
};


import logger from "../logger/logger";
import { IElasticNode } from "../models/cluster-node.model";
import { getClusterInfoById } from "./cluster-info.service";
import { ansibleInventoryService } from "./ansible-inventory.service";
import { ansibleRunnerService } from "./ansible-runner.service";
import { ClusterType, NodeStatus } from "../enums";
import { randomUUID } from "crypto";
import { NotificationEventType, notificationService, NotificationType } from "./notification.service";
import { clusterUpgradeJobService } from "./cluster-upgrade-job.service";
import { clusterNodeService } from "./cluster-node.service";

class ClusterUpgradeService {
	async triggerElasticNodeUpgrade(nodeId: string, clusterId: string) {
		try {
			const node = await clusterNodeService.getElasticNodeById(nodeId);
			if (!node) {
				return false;
			}
			const clusterInfo = await getClusterInfoById(clusterId);
			const clusterUpgradeJob = await clusterUpgradeJobService.getActiveClusterUpgradeJobByClusterId(clusterId);
			const pathToKey = clusterInfo.pathToKey ? clusterInfo.pathToKey : "";

			const inventoryPath = await ansibleInventoryService.createInventoryForNode({
				node: node,
				pathToKey,
				sshUser: clusterInfo.sshUser,
			});
			if (!clusterUpgradeJob.targetVersion || !clusterInfo.elastic.username || !clusterInfo.elastic.password) {
				return false;
			}
			const playbookRunId = randomUUID();

			ansibleRunnerService
				.runPlaybook({
					playbookPath: "playbooks/main.yml",
					inventoryPath: inventoryPath,
					variables: {
						elk_version: clusterUpgradeJob.targetVersion,
						es_username: clusterInfo.elastic.username,
						es_password: clusterInfo.elastic.password,
						es_api_key: clusterInfo.elastic.apiKey,
						elasticsearch_uri: clusterInfo.elastic.url,
						cluster_type: ClusterType.ELASTIC,
						playbook_run_id: playbookRunId,
						playbook_run_type: "UPGRADE",
						current_version: clusterUpgradeJob.currentVersion,
					},
				})
				.then(() => {
					notificationService.sendNotification({
						type: NotificationEventType.NOTIFICATION,
						title: "Upgrade Successful",
						message: "Node has been successfully upgraded to the target version.",
						notificationType: NotificationType.SUCCESS,
						clusterId: clusterId,
					});
				})
				.catch(() => {
					notificationService.sendNotification({
						type: NotificationEventType.NOTIFICATION,
						title: "Upgrade Failed",
						message: "An error occurred while upgrading the node. Please check the logs for more details.",
						notificationType: NotificationType.ERROR,
					});
				});

			return new Promise((resolve) => resolve(true));
		} catch (error) {
			logger.error(`Error performing upgrade for node with id ${nodeId}`);
			return false;
		}
	}

	async triggerElasticNodesUpgrade(nodes: IElasticNode[], clusterId: string) {
		try {
			const clusterInfo = await getClusterInfoById(clusterId);
			const clusterUpgradeJob = await clusterUpgradeJobService.getActiveClusterUpgradeJobByClusterId(clusterId);
			const pathToKey = clusterInfo.pathToKey ? clusterInfo.pathToKey : "";

			const inventoryPath = await ansibleInventoryService.createInventory({
				pathToKey,
				sshUser: clusterInfo.sshUser,
				nodes: nodes,
			});
			if (!clusterUpgradeJob.targetVersion || !clusterInfo.elastic.username || !clusterInfo.elastic.password) {
				return false;
			}
			const playbookRunId = randomUUID();

			ansibleRunnerService
				.runPlaybook({
					playbookPath: "playbooks/main.yml",
					inventoryPath: inventoryPath,
					variables: {
						elk_version: clusterUpgradeJob.targetVersion,
						es_username: clusterInfo.elastic.username,
						es_password: clusterInfo.elastic.password,
						es_api_key: clusterInfo.elastic.apiKey,
						elasticsearch_uri: clusterInfo.elastic.url,
						cluster_type: ClusterType.ELASTIC,
						playbook_run_id: playbookRunId,
						playbook_run_type: "UPGRADE",
						current_version: clusterUpgradeJob.currentVersion,
					},
				})
				.then(() => {
					notificationService.sendNotification({
						type: NotificationEventType.NOTIFICATION,
						title: "Upgrade Successful",
						message: "All nodes have been successfully upgraded to the target version.",
						notificationType: NotificationType.SUCCESS,
						clusterId: clusterId,
					});
				})
				.catch(() => {
					notificationService.sendNotification({
						type: NotificationEventType.NOTIFICATION,
						title: "Upgrade Failed",
						message: "An error occurred while upgrading the nodes. Please check the logs for more details.",
						notificationType: NotificationType.ERROR,
					});
				});
		} catch (error: any) {
			logger.error(`Error performing upgrade for nodes:  ${nodes} because of ${error.message}`);
			throw new Error(`Error performing upgrade for nodes:  ${nodes}`);
		}
	}

	async triggerKibanaNodeUpgrade(nodeId: string, clusterId: string) {
		try {
			const node = await clusterNodeService.getKibanaNodeById(nodeId);
			if (!node) {
				logger.error(`Kibana node not found for [nodeId:${nodeId}]`);
				return;
			}
			const clusterInfo = await getClusterInfoById(clusterId);
			const clusterUpgradeJob = await clusterUpgradeJobService.getActiveClusterUpgradeJobByClusterId(clusterId);
			const pathToKey = clusterInfo.pathToKey ? clusterInfo.pathToKey : ""; //Should be stored in clusterInfo
			const inventoryPath = await ansibleInventoryService.createInventoryForNode({
				pathToKey,
				sshUser: clusterInfo.sshUser,
				node: node,
			});
			if (!clusterInfo.elastic.username || !clusterInfo.elastic.password) {
				return;
			}
			const playbookRunId = randomUUID();

			ansibleRunnerService
				.runPlaybook({
					playbookPath: "playbooks/main.yml",
					inventoryPath: inventoryPath,
					variables: {
						elk_version: clusterUpgradeJob.targetVersion,
						es_username: clusterInfo.elastic.username,
						es_password: clusterInfo.elastic.password,
						es_api_key: clusterInfo.elastic.apiKey,
						elasticsearch_uri: clusterInfo.elastic.url,
						cluster_type: ClusterType.KIBANA,
						playbook_run_id: playbookRunId,
						playbook_run_type: "UPGRADE",
						current_version: clusterUpgradeJob.currentVersion,
					},
				})
				.then(async () => {
					await clusterNodeService.updateNodesPartially(
						{ nodeId: nodeId },
						{ status: NodeStatus.UPGRADED, progress: 100, version: clusterUpgradeJob.targetVersion }
					);
					notificationService.sendNotification({
						type: NotificationEventType.NOTIFICATION,
						title: "Upgrade Successful",
						message: "Kibana node has been successfully upgraded to the target version.",
						notificationType: NotificationType.SUCCESS,
						clusterId: clusterId,
					});
				})
				.catch(async () => {
					await clusterNodeService.updateNodesPartially({ nodeId: nodeId }, { status: NodeStatus.FAILED });
					notificationService.sendNotification({
						type: NotificationEventType.NOTIFICATION,
						title: "Upgrade Failed",
						message:
							"An error occurred while upgrading the kibana node. Please check the logs for more details.",
						notificationType: NotificationType.ERROR,
						clusterId: clusterId,
					});
				});
		} catch (error) {
			logger.error(`Error performing upgrade for node with id ${nodeId}`);
		}
	}
}

export const clusterUpgradeService = new ClusterUpgradeService();

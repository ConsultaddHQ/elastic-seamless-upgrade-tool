import logger from "../logger/logger";
import { generateHash } from "../utils/hash-utils";
import { getClusterInfo } from "./cluster-info.service";
import { NotificationEventType, notificationService } from "./notification.service";
import { syncElasticNodesData } from "./sync.service";

type ClusterId = string;

class ClusterMonitorService {
	private clusterIds: Set<ClusterId> = new Set();
	private previousDataHash: Map<ClusterId, string> = new Map();

	constructor() {
		this.start();
	}

	start() {
		setInterval(() => this.pollClusters(), 3000);
	}

	addCluster(clusterId: ClusterId) {
		this.clusterIds.add(clusterId);
	}

	removeCluster(clusterId: ClusterId) {
		this.clusterIds.delete(clusterId);
		this.previousDataHash.delete(clusterId);
	}

	private async pollClusters() {
		for (const clusterId of this.clusterIds) {
			try {
				const clusterInfo = await getClusterInfo(clusterId);
				const newDataHash = generateHash(clusterInfo);
				const oldDataHash = this.previousDataHash.get(clusterId);

				if (!oldDataHash || oldDataHash !== newDataHash) {
					logger.debug(`[clusterId: ${clusterId}] Cluster info changed`);
					this.previousDataHash.set(clusterId, newDataHash);
					notificationService.sendNotification({
						type: NotificationEventType.CLUSTER_INFO_CHANGE,
					});
				} else {
					logger.debug(`[clusterId: ${clusterId}]  No change for cluster info`);
				}
			} catch (err) {
				logger.error(`Failed to fetch data for ${clusterId}:`, err);
			}

			try {
				await syncElasticNodesData(clusterId);
			} catch (err) {
				logger.error(`Failed to sync elastic nodes for cluster with [clusterId:${clusterId}]`);
			}
		}
	}
}
export const clusterMonitorService = new ClusterMonitorService();

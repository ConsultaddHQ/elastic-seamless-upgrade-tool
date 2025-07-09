import { PrecheckExecutionRequest } from "./types/interfaces";
import { clusterUpgradeJobService } from "../services/cluster-upgrade-job.service";
import { precheckRegistry } from "./precheck-registry";
import { randomUUID } from "crypto";
import { getClusterInfoById } from "../services/cluster-info.service";
import { PrecheckGroup } from "../models/precheck-group.model";
import { PrecheckStatus } from "../enums";
import { BasePrecheck } from "./base/base-precheck";
import logger from "../logger/logger";
import { NotificationEventType, notificationService } from "../services/notification.service";

class PrecheckRunner {
	async runAll(clusterUpgradeJobId: string): Promise<void> {
		const groupId = randomUUID();
		await PrecheckGroup.create({
			precheckGroupId: groupId,
			clusterUpgradeJobId: clusterUpgradeJobId,
			status: PrecheckStatus.RUNNING,
		});
		const job = await clusterUpgradeJobService.getClusterUpgradeJobByJobId(clusterUpgradeJobId);
		const cluster = await getClusterInfoById(job.clusterId);
		const defaultRequest: Omit<PrecheckExecutionRequest, "context"> = {
			cluster: cluster,
			upgradeJob: job,
			precheckGroupId: groupId,
		};

		logger.info(`Running ${precheckRegistry.getPrechecks().length} prechecks on cluster ${job.clusterId}`);

		const prechecks: BasePrecheck[] = [];

		for (const precheck of precheckRegistry.getPrechecks()) {
			const isValid = await precheck.shouldRunFor({ ...defaultRequest, context: {} });
			if (isValid) {
				prechecks.push(precheck);
			}
		}

		for (const precheck of prechecks) {
			try {
				await precheck.preExecute({ ...defaultRequest, context: {} });
			} catch (err) {}
		}

		this.notify();

		for (const precheck of prechecks) {
			try {
				await precheck.execute({ ...defaultRequest, context: {} });
			} catch (err) {}
			this.notify();
		}

		await PrecheckGroup.findOneAndUpdate(
			{
				precheckGroupId: groupId,
			},
			{
				status: PrecheckStatus.COMPLETED,
			}
		);
		logger.debug(`All prechecks completed. [PrecheckGroupId: ${groupId}]`);
	}

	private notify() {
		notificationService.sendNotification({
			type: NotificationEventType.PRECHECK_PROGRESS_CHANGE,
		});
	}
}

export const precheckRunner = new PrecheckRunner();

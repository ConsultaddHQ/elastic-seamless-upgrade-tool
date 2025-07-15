import { PrecheckExecutionRequest } from "./types/interfaces";
import { precheckRegistry } from "./precheck-registry";
import { randomUUID } from "crypto";
import { getClusterInfoById } from "../services/cluster-info.service";
import { IPrecheckGroup, PrecheckGroup } from "../models/precheck-group.model";
import { PrecheckStatus } from "../enums";
import { BasePrecheck } from "./base/base-precheck";
import logger from "../logger/logger";
import { NotificationEventType, notificationService } from "../services/notification.service";
import { IClusterUpgradeJob } from "../models/cluster-upgrade-job.model";
import { precheckGroupService } from "../services/precheck-group.service";
import { ConflictError } from "../errors";
import { precheckService } from "../services/precheck.service";

class PrecheckRunner {
	async schedule(job: IClusterUpgradeJob): Promise<void> {
		await this.validate(job);
		const groupId = randomUUID();
		const group = await PrecheckGroup.create({
			precheckGroupId: groupId,
			clusterUpgradeJobId: job.jobId,
			status: PrecheckStatus.RUNNING,
		});

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

		this.run(job, prechecks, group);
	}

	private async run(job: IClusterUpgradeJob, prechecks: BasePrecheck[], group: IPrecheckGroup): Promise<void> {
		const groupId = group.precheckGroupId;

		const cluster = await getClusterInfoById(job.clusterId);
		const defaultRequest: Omit<PrecheckExecutionRequest, "context"> = {
			cluster: cluster,
			upgradeJob: job,
			precheckGroupId: groupId,
		};

		logger.info(`Running ${precheckRegistry.getPrechecks().length} prechecks on cluster ${job.clusterId}`);

		for (const precheck of prechecks) {
			try {
				await precheck.execute({ ...defaultRequest, context: {} });
			} catch (err) {}
			this.notify();
		}
		const status = await precheckService.getPrecheckStatusByGroupId(groupId);
		await PrecheckGroup.findOneAndUpdate(
			{
				precheckGroupId: groupId,
			},
			{
				status: status,
			}
		);
		logger.debug(`All prechecks completed. [PrecheckGroupId: ${groupId}]`);
	}

	private async validate(job: IClusterUpgradeJob) {
		const group = await precheckGroupService.getLatestGroupByJobId(job.jobId);
		const isRunning =
			group && !(group.status === PrecheckStatus.COMPLETED || group.status === PrecheckStatus.FAILED);
		// Ensure the last job was created at least two minutes ago before triggering a new one
		const isOldEnough = group?.createdAt && Date.now() - new Date(group.createdAt).getTime() > 2 * 60 * 1000;
		if (isRunning && !isOldEnough) {
			throw new ConflictError(
				`A precheck is already in progress for this cluster upgrade job (Group ID: ${group.precheckGroupId}). Please wait until it completes or fails before starting a new one.`
			);
		}
	}
	private notify() {
		notificationService.sendNotification({
			type: NotificationEventType.PRECHECK_PROGRESS_CHANGE,
		});
	}
}

export const precheckRunner = new PrecheckRunner();

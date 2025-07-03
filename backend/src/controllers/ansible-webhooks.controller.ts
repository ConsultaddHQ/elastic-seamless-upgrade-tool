import { Request, Response } from "express";
import logger from "../logger/logger";
import { updateNode } from "../services/elastic-node.service.";
import { updateKibanaNode } from "../services/kibana-node.service";
import {
	AnsibleRequestType,
	AnsibleTaskStatus,
	ClusterType,
	mapAnsibleToPrecheckStatus,
	mapAnsibleToUpgradeStatus,
	NodeStatus,
} from "../enums";
import { updateRunStatus } from "../services/precheck-runs.service";
import { NotificationEventType, notificationService } from "../services/notification.service";

interface HostInfoUpgrade {
	ip: string;
	name: string;
	progress: number;
}
interface HostInfoPrecheck {
	ip: string;
	name: string;
	progress: number;
	precheckId: string;
	task: string;
	logs?: {
		stdout: string;
		stderr: string;
	};
}

interface BaseAnsibleRequest {
	clusterType: ClusterType;
	logs?: string[];
	status: AnsibleTaskStatus;
	playbookRunId: string;
	host: HostInfoPrecheck;
	error?: string;
}
export interface AnsibleRequestPrecheck extends BaseAnsibleRequest {
	type: AnsibleRequestType.PRECHECK;
	precheckId: string;
	clusterType: ClusterType;
	precheck: string;
}
export interface AnsibleRequestUpgrade extends BaseAnsibleRequest {
	type: AnsibleRequestType.UPGRADE;
	progress?: number;
	taskName: string;
}

export type AnsibleRequest = AnsibleRequestPrecheck | AnsibleRequestUpgrade;

export const handleAnsibleWebhook = async (req: Request, res: Response) => {
	try {
		const body: AnsibleRequest = req.body;
		const { type, status, playbookRunId } = body;
		logger.info(
			`Received Ansible webhook [playbookRunId: ${playbookRunId}] of [type: ${type}]  [Hook Body: ${JSON.stringify(req.body, null, 2)}]`
		);
		if (type === AnsibleRequestType.UPGRADE) {
			const { clusterType, host } = body;
			// Handle upgrade request
			const nodeStatus = mapAnsibleToUpgradeStatus(status);
			if (clusterType === ClusterType.ELASTIC) {
				updateNode(
					{ ip: host.ip },
					{
						progress: host.progress,
						status: nodeStatus || NodeStatus.UPGRADING,
					}
				);
			} else {
				updateKibanaNode(
					{ ip: host.ip },
					{
						progress: host.progress,
						status: nodeStatus || NodeStatus.UPGRADING,
					}
				);
			}
			notificationService.sendNotification({
				type: NotificationEventType.UPGRADE_PROGRESS_CHANGE,
			});
		} else {
			//fetch precheck data and update corresponding run
			const { playbookRunId, host, error = "" } = body;
			const { precheckId, ip, logs, task } = host;
			const taskLog = `Task: ${task}`;
			const processedLogs = !logs
				? [taskLog, error]
				: [taskLog, ...logs.stdout.split("\n"), ...logs.stderr.split("\n"), error].filter((log) => log);
			await updateRunStatus(
				{ precheckRunId: playbookRunId, precheckId: precheckId, ip: ip },
				mapAnsibleToPrecheckStatus(status),
				processedLogs
			);
			notificationService.sendNotification({
				type: NotificationEventType.PRECHECK_PROGRESS_CHANGE,
			});
		}
		res.sendStatus(200);
		// Handle the webhook data here
	} catch (error) {
		logger.error(`Error handling Ansible request: ${error}`);
		res.sendStatus(400);
	}
};

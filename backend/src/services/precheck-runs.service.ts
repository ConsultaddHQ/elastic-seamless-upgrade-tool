import { randomUUID } from "crypto";
import { PRECHECK_CONFIG, getPrecheckById } from "../config/precheck-config";
import { PrecheckStatus } from "../enums";
import logger from "../logger/logger";
import NodePrecheckRun, { INodePrecheckRun, INodePrecheckRunDocument } from "../models/node-precheck-runs.model";
import { ansibleInventoryService } from "./ansible-inventory.service";
import { ansibleRunnerService } from "./ansible-runner.service";
import { getClusterInfoById } from "./cluster-info.service";
import { IElasticNode } from "../models/elastic-node.model";

export interface PrecheckRunJob {
	precheckId: string;
	clusterId: string;
	playbookRunId: string;
	inventoryPath: string;
}

const PRECHECK_RUN_JOB_QUEUE: PrecheckRunJob[] = [];
export const addPrecheckRunJobs = (jobs: PrecheckRunJob[]) => {
	PRECHECK_RUN_JOB_QUEUE.push(...jobs);
};
export const getPrecheckRunJob = (): PrecheckRunJob | undefined => {
	return PRECHECK_RUN_JOB_QUEUE.shift();
};

export const schedulePrecheckRun = async (): Promise<void> => {
	while (true) {
		const job = getPrecheckRunJob();
		if (!job) {
			logger.debug("No jobs in the queue. Waiting for new jobs...");
			await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 second before checking again
			continue;
		}

		try {
			logger.info(`Processing precheck run job: ${JSON.stringify(job)}`);
			const { precheckId, clusterId, playbookRunId, inventoryPath } = job;
			const { elastic, targetVersion } = await getClusterInfoById(clusterId);
			const precheck = getPrecheckById(precheckId);

			if (!precheck) {
				logger.error(`Precheck with ID ${precheckId} not found.`);
				continue;
			}
			await ansibleRunnerService
				.runPlaybook({
					playbookPath: precheck.playbookPath,
					inventoryPath: inventoryPath,
					variables: {
						elk_version: targetVersion,
						es_username: elastic.username!!,
						es_password: elastic.password!!,
						cluster_type: "ELASTIC",
						playbook_run_id: playbookRunId,
						playbook_run_type: "PRECHECK",
					},
				})
				.then(() => {})
				.catch(async () => {
					//TODO handle completion here as well
				});
		} catch (error: any) {
			logger.error(`Error processing job ${JSON.stringify(job)}: ${error.message}`);
		}
	}
};

schedulePrecheckRun();

export const getRunByName = async (precheck: string, nodeName: string): Promise<INodePrecheckRun | null> => {
	const nodePrecheckRun = await NodePrecheckRun.findOne({ nodeName, precheck }).sort({ createdAt: -1 });
	if (!nodePrecheckRun) return null;
	return nodePrecheckRun;
};

export const getLatestRunsByPrecheck = async (clusterId: string): Promise<INodePrecheckRunDocument[]> => {
	return await NodePrecheckRun.aggregate([
		{ $match: { clusterId } },
		{
			$sort: { startedAt: -1 },
		},
		{
			$group: {
				_id: { ip: "$ip", precheckId: "$precheckId" },
				precheckRun: { $first: "$$ROOT" },
			},
		},
		{
			$replaceRoot: { newRoot: "$precheckRun" },
		},
		{
			$sort: { ip: 1, precheckId: 1 },
		},
	]);
};

export const updateRunStatus = async (
	identifier: Partial<INodePrecheckRun>,
	newStatus: PrecheckStatus,
	logs: string[]
): Promise<void> => {
	try {
		const endAt =
			newStatus === PrecheckStatus.COMPLETED || newStatus === PrecheckStatus.FAILED ? Date.now() : undefined;
		const updatedNode = await NodePrecheckRun.findOneAndUpdate(
			identifier,
			{
				status: newStatus,
				endAt: endAt,
				$push: { logs: { $each: logs } },
			},
			{ new: true, runValidators: true }
		);
		if (!updatedNode) {
			logger.debug(`Node with identifier ${identifier} not found.`);
			return;
		}
	} catch (error: any) {
		console.error(`Error updating status for node ${identifier}: ${error.message}`);
		throw error;
	}
};

export const runPrecheck = async (nodes: IElasticNode[], clusterId: string) => {
	const runId = randomUUID();
	const clusterInfo = await getClusterInfoById(clusterId);
	if (!clusterInfo.pathToKey) {
		throw new Error("Cluster info not found or path to key is missing");
	}

	const startedAt = new Date();
	const precheckRuns: INodePrecheckRun[] = nodes
		.map((node) => ({
			ip: node.ip,
			nodeId: node.nodeId,
			precheckRunId: runId,
			startedAt: startedAt,
			status: PrecheckStatus.PENDING,
			logs: [],
			clusterId: clusterId,
		}))
		.map((precheck) => {
			return PRECHECK_CONFIG.map(({ id: precheckId }) => ({
				...precheck,
				precheckId,
			}));
		})
		.flat();
	await NodePrecheckRun.insertMany(precheckRuns);

	Promise.all(
		precheckRuns.map(async (precheckRun) => {
			const inventoryFileName = `${precheckRun.precheckRunId}-${precheckRun.ip}.ini`;
			await ansibleInventoryService.createInventoryForPrecheckPerNode({
				node: { ip: precheckRun.ip, name: precheckRun.ip },
				iniName: inventoryFileName,
				pathToKey: clusterInfo.pathToKey!!,
				sshUser: clusterInfo.sshUser,
			});
			const precheckRunJob: PrecheckRunJob = {
				precheckId: precheckRun.precheckId,
				clusterId: clusterId,
				playbookRunId: precheckRun.precheckRunId,
				inventoryPath: `ini/${inventoryFileName}`,
			};
			return precheckRunJob;
		})
	).then((precheckRuns) => {
		addPrecheckRunJobs(precheckRuns);
	});
	return runId;
};

export const getMergedPrecheckStatus = (precheckRuns: PrecheckStatus[]) => {
	let hasCompleted = false;
	let hasPending = false;
	let hasRunning = false;

	for (const run of precheckRuns) {
		if (run === PrecheckStatus.FAILED) return PrecheckStatus.FAILED;
		if (run === PrecheckStatus.RUNNING) hasRunning = true;
		if (run === PrecheckStatus.PENDING) hasPending = true;
		if (run === PrecheckStatus.COMPLETED) hasCompleted = true;
	}

	if ((hasPending && hasCompleted) || hasRunning) return PrecheckStatus.RUNNING;
	if (hasPending) return PrecheckStatus.PENDING;
	return PrecheckStatus.COMPLETED;
};

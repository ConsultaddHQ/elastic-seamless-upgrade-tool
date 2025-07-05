import { randomUUID } from "crypto";
import { PRECHECK_CONFIG, getPrecheckById } from "../config/precheck.config";
import { PrecheckStatus } from "../enums";
import logger from "../logger/logger";
import { NodePrecheckRun, INodePrecheckRun, INodePrecheckRunDocument } from "../models/node-precheck-runs.model";
import { ansibleInventoryService } from "./ansible-inventory.service";
import { ansibleRunnerService } from "./ansible-runner.service";
import { getClusterInfoById } from "./cluster-info.service";
import { NotFoundError } from "../errors";
import { UpdateQuery } from "mongoose";
import { clusterUpgradeJobService } from "./cluster-upgrade-job.service";
import { IElasticNode } from "../models/cluster-node.model";

export interface PrecheckRunJob {
	precheckId: string;
	clusterUpgradeJobId: string;
	playbookRunId: string;
	inventoryPath: string;
	ip: string;
}

const PRECHECK_RUN_JOB_QUEUE: PrecheckRunJob[] = [];
export const addPrecheckRunJobs = (jobs: PrecheckRunJob[]) => {
	PRECHECK_RUN_JOB_QUEUE.push(...jobs);
};
export const getPrecheckRunJob = (): PrecheckRunJob | undefined => {
	return PRECHECK_RUN_JOB_QUEUE.shift();
};

const runningIPs = new Set<string>();

export const schedulePrecheckRun = async (): Promise<void> => {
	while (true) {
		const availableJobs = PRECHECK_RUN_JOB_QUEUE.filter((job) => {
			if (!runningIPs.has(job.ip)) {
				runningIPs.add(job.ip);
				return true;
			}
			return false;
		});

		if (availableJobs.length === 0) {
			logger.debug("No available jobs to process. Waiting...");
			await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait before next check
			continue;
		}

		// Start one job per available IP
		await Promise.allSettled(
			availableJobs.map(async (job) => {
				const { ip } = job;

				// Mark IP as running
				runningIPs.add(ip);
				PRECHECK_RUN_JOB_QUEUE.splice(PRECHECK_RUN_JOB_QUEUE.indexOf(job), 1); // Remove from queue

				try {
					logger.info(`Processing precheck run job for IP ${ip}`);
					const { precheckId, clusterUpgradeJobId, playbookRunId, inventoryPath } = job;
					const clusterUpgradeJob =
						await clusterUpgradeJobService.getClusterUpgradeJobByJobId(clusterUpgradeJobId);
					const { elastic } = await getClusterInfoById(clusterUpgradeJob.clusterId);
					const precheck = getPrecheckById(precheckId);

					if (!precheck) {
						logger.error(`Precheck with ID ${precheckId} not found.`);
						return;
					}

					const identifier = {
						precheckId,
						precheckRunId: playbookRunId,
						ip,
					};

					await updateNodePrecheckRuns(identifier, { startedAt: Date.now() });

					await ansibleRunnerService.runPlaybook({
						playbookPath: precheck.playbookPath,
						inventoryPath,
						variables: {
							elk_version: clusterUpgradeJob.targetVersion,
							elasticsearch_uri: elastic.url,
							es_username: elastic.username!!,
							es_password: elastic.password!!,
							cluster_type: "ELASTIC",
							playbook_run_id: playbookRunId,
							playbook_run_type: "PRECHECK",
							current_version: clusterUpgradeJob.currentVersion,
						},
					});

					await updateRunStatus(identifier, PrecheckStatus.COMPLETED, []);
				} catch (error: any) {
					logger.error(`Error processing job for IP ${ip}: ${error.message}`);
					await updateRunStatus(
						{
							precheckId: job.precheckId,
							precheckRunId: job.playbookRunId,
							ip: job.ip,
						},
						PrecheckStatus.FAILED,
						[]
					);
				} finally {
					runningIPs.delete(ip); // Allow future jobs for this IP
				}
			})
		);
	}
};

schedulePrecheckRun();

export const getRunByName = async (precheck: string, nodeName: string): Promise<INodePrecheckRun | null> => {
	const nodePrecheckRun = await NodePrecheckRun.findOne({ nodeName, precheck }).sort({ createdAt: -1 });
	if (!nodePrecheckRun) return null;
	return nodePrecheckRun;
};

export const getLatestRunsByPrecheck = async (clusterId: string): Promise<INodePrecheckRunDocument[]> => {
	const clusterUpgradeJob = await clusterUpgradeJobService.getLatestClusterUpgradeJobByClusterId(clusterId);
	if (!clusterUpgradeJob) {
		throw new NotFoundError(`No cluster upgrade job found for clusterId: ${clusterId}`);
	}
	return await NodePrecheckRun.aggregate([
		{ $match: { clusterUpgradeJobId: clusterUpgradeJob?.jobId } },
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
	const updates: UpdateQuery<INodePrecheckRun> = {
		status: newStatus,
		$push: { logs: { $each: logs } },
	};
	if (newStatus === PrecheckStatus.COMPLETED || newStatus === PrecheckStatus.FAILED) {
		updates.endAt = Date.now();
	} else if (newStatus === PrecheckStatus.RUNNING) {
		// Need to confirm that ansible plugin not send this status mulitple time before setting start time based on this.
		// updates.startedAt === Date.now();
	}
	await updateNodePrecheckRuns(identifier, updates);
};

export const updateNodePrecheckRuns = async (
	identifier: Partial<INodePrecheckRun>,
	updates: UpdateQuery<INodePrecheckRun>
): Promise<void> => {
	try {
		const updatedNode = await NodePrecheckRun.findOneAndUpdate(identifier, updates, {
			new: true,
			runValidators: true,
		});
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
		throw new NotFoundError("Cluster info not found or path to key is missing");
	}
	const clusterUpgradeJob = await clusterUpgradeJobService.getActiveClusterUpgradeJobByClusterId(clusterId);

	const startedAt = new Date();
	const precheckRuns: INodePrecheckRun[] = nodes
		.map((node) => ({
			ip: node.ip,
			nodeId: node.nodeId,
			nodeName: node.name,
			precheckRunId: runId,
			startedAt: startedAt,
			status: PrecheckStatus.PENDING,
			logs: [],
			clusterUpgradeJobId: clusterUpgradeJob.jobId,
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
				clusterUpgradeJobId: clusterUpgradeJob.jobId,
				playbookRunId: precheckRun.precheckRunId,
				inventoryPath: `ini/${inventoryFileName}`,
				ip: precheckRun.ip,
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

export const getPrechecksGroupedByNode = async (clusterId: string) => {
	const precheckRuns = await getLatestRunsByPrecheck(clusterId);
	if (!precheckRuns || precheckRuns.length === 0) {
		throw new NotFoundError("No precheck runs found");
	}
	const groupedPrecheckRunsByNodeId = precheckRuns.reduce<Record<string, typeof precheckRuns>>((acc, run) => {
		const groupedBy = run.nodeId;
		if (!acc[groupedBy]) {
			acc[groupedBy] = [];
		}
		acc[groupedBy].push(run);
		return acc;
	}, {});

	return Object.entries(groupedPrecheckRunsByNodeId).map(([nodeId, precheckRuns]) => {
		const status = getMergedPrecheckStatus(precheckRuns.map((precheck) => precheck.status));
		const precheck = precheckRuns[0];
		const transformPrecheckRunForUI = (precheck: INodePrecheckRun) => {
			const { name } = getPrecheckById(precheck.precheckId) || {};
			const duration = precheck.endAt
				? parseFloat(((precheck.endAt.getTime() - precheck.startedAt.getTime()) / 1000).toFixed(2))
				: null;
			return {
				id: precheck.precheckId,
				name: name,
				status: precheck.status,
				logs: precheck.logs,
				startTime: precheck.startedAt,
				endTime: precheck.endAt,
				duration: duration,
			};
		};
		return {
			nodeId: nodeId,
			ip: precheck.ip,
			name: precheck.nodeName,
			status: status,
			prechecks: precheckRuns.map(transformPrecheckRunForUI),
		};
	});
};

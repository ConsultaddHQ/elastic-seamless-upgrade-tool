import { getPrecheckById } from "../config/precheck.config";
import { PrecheckStatus } from "../enums";
import { NotFoundError } from "../errors";
import { clusterUpgradeJobService } from "./cluster-upgrade-job.service";
import { INodePrecheck, IPrecheck, IPrecheckDocument, Precheck } from "../models/precheck.model";
import { PrecheckType } from "../prechecks/types/enums";

export interface PrecheckRunJob {
	precheckId: string;
	clusterUpgradeJobId: string;
	playbookRunId: string;
	inventoryPath: string;
	ip: string;
}

export const getLatestRunsByPrecheck = async (clusterId: string): Promise<IPrecheckDocument[]> => {
	const clusterUpgradeJob = await clusterUpgradeJobService.getLatestClusterUpgradeJobByClusterId(clusterId);
	if (!clusterUpgradeJob) {
		throw new NotFoundError(`No cluster upgrade job found for clusterId: ${clusterId}`);
	}
	return await Precheck.aggregate([
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
	const groupedPrecheckRunsByNodeId = precheckRuns
		.filter((p) => p.type === PrecheckType.NODE)
		.map((p) => p as INodePrecheck)
		.reduce<Record<string, INodePrecheck[]>>((acc, run) => {
			const groupedBy = run.node.id;
			if (!acc[groupedBy]) {
				acc[groupedBy] = [];
			}
			acc[groupedBy].push(run);
			return acc;
		}, {});

	return Object.entries(groupedPrecheckRunsByNodeId).map(([nodeId, precheckRuns]) => {
		const status = getMergedPrecheckStatus(precheckRuns.map((precheck) => precheck.status));
		const precheck = precheckRuns[0];
		const transformPrecheckRunForUI = (precheck: IPrecheck) => {
			const { name } = getPrecheckById(precheck.precheckId) || {};
			const duration =
				precheck.endAt && precheck.startedAt
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
			ip: precheck.node.id,
			name: precheck.node.name,
			status: status,
			prechecks: precheckRuns.map(transformPrecheckRunForUI),
		};
	});
};

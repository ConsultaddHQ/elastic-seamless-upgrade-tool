import { PrecheckStatus } from "../enums";
import { NotFoundError } from "../errors";
import { clusterUpgradeJobService } from "./cluster-upgrade-job.service";
import { INodePrecheck, IPrecheck, IPrecheckDocument, Precheck } from "../models/precheck.model";
import { PrecheckType } from "../prechecks/types/enums";
import { precheckGroupService } from "./precheck-group.service";
import { precheckService } from "./precheck.service";

export const getLatestRunsByPrecheck = async (clusterId: string): Promise<IPrecheckDocument[]> => {
	const job = await clusterUpgradeJobService.getActiveClusterUpgradeJobByClusterId(clusterId);
	const group = await precheckGroupService.getLatestGroupByJobId(job.jobId);
	if (!group) {
		throw new NotFoundError("No precheck found");
	}
	return await Precheck.aggregate([
		{ $match: { precechGroupId: group.precheckGroupId } },
		{
			$sort: { startedAt: -1 },
		},
		{
			$group: {
				_id: { ip: "$node.ip", precheckId: "$precheckId" },
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

export const getPrechecksGroupedByNode = async (groupId: string) => {
	const precheckRuns = await getLatestRunsByPrecheck(groupId);
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
		const status = precheckService.getMergedPrecheckStatus(precheckRuns.map((precheck) => precheck.status));
		const precheck = precheckRuns[0];
		const transformPrecheckRunForUI = (precheck: IPrecheck) => {
			const duration =
				precheck.endAt && precheck.startedAt
					? parseFloat(((precheck.endAt.getTime() - precheck.startedAt.getTime()) / 1000).toFixed(2))
					: null;
			return {
				id: precheck.precheckId,
				name: precheck.name,
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

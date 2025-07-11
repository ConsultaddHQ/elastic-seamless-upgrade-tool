import { RootFilterQuery, UpdateQuery } from "mongoose";
import { IClusterPrecheck, IIndexPrecheck, INodePrecheck, IPrecheck, Precheck } from "../models/precheck.model";
import logger from "../logger/logger";
import { PrecheckStatus } from "../enums";
import { PrecheckType } from "../prechecks/types/enums";
import { clusterUpgradeJobService } from "./cluster-upgrade-job.service";
import { precheckGroupService } from "./precheck-group.service";
import { NotFoundError } from "../errors";

class PrecheckService {
	async addLog(identifier: RootFilterQuery<IPrecheck>, logs: string[]) {
		const updates: UpdateQuery<IPrecheck> = {
			$push: { logs: { $each: logs } },
		};
		await this.updateOne(identifier, updates);
	}

	async updateOne(identifier: RootFilterQuery<IPrecheck>, updates: UpdateQuery<IPrecheck>): Promise<void> {
		try {
			const updatedNode = await Precheck.findOneAndUpdate(identifier, updates, {
				runValidators: true,
			});
		} catch (error: any) {
			logger.error(`Error updating precheck ${identifier}: ${error.message}`);
		}
	}

	async getGroupedPrecheckByClusterId(clusterId: string) {
		const upgradeJob = await clusterUpgradeJobService.getLatestClusterUpgradeJobByClusterId(clusterId);
		const precheckGroup = await precheckGroupService.getLatestGroupByJobId(upgradeJob.jobId);
		if (!precheckGroup) {
			throw new NotFoundError("Precheck group not found");
		}
		return await this.getGroupedPrecheckByGroupId(precheckGroup.precheckGroupId);
	}

	async getGroupedPrecheckByGroupId(precechGroupId: string) {
		const prechecks = await Precheck.find({ precechGroupId: precechGroupId });

		const nodePrechecks = prechecks
			.filter((precheck) => precheck.type === PrecheckType.NODE)
			.map((precheck) => precheck as INodePrecheck);

		const indexPrechecks = prechecks
			.filter((precheck) => precheck.type === PrecheckType.INDEX)
			.map((precheck) => precheck as IIndexPrecheck);

		const clusterPrechecks = prechecks
			.filter((precheck) => precheck.type === PrecheckType.CLUSTER)
			.map((precheck) => precheck as IClusterPrecheck);

		const clusterPrechecksUi = clusterPrechecks.map((precheck) => {
			const duration =
				precheck.endAt && precheck.startedAt
					? parseFloat(((precheck.endAt.getTime() - precheck.startedAt.getTime()) / 1000).toFixed(2))
					: null;
			return {
				id: precheck.precheckId,
				name: precheck.name,
				status: precheck.status,
				logs: precheck.logs,
				duration: duration,
			};
		});
		return {
			node: this.groupedByNode(nodePrechecks),
			cluster: clusterPrechecksUi,
			index: this.groupedByIndex(indexPrechecks),
		};
	}

	getMergedPrecheckStatus(precheckRuns: PrecheckStatus[]) {
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
	}

	private groupedByNode(prechecks: INodePrecheck[]) {
		const groupedPrecheckRunsByNodeId = prechecks.reduce<Record<string, INodePrecheck[]>>((acc, run) => {
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
	}

	private groupedByIndex(prechecks: IIndexPrecheck[]) {
		const groupedPrecheckRunsByIndex = prechecks.reduce<Record<string, IIndexPrecheck[]>>((acc, run) => {
			const groupedBy = run.index.name;
			if (!acc[groupedBy]) {
				acc[groupedBy] = [];
			}
			acc[groupedBy].push(run);
			return acc;
		}, {});

		return Object.entries(groupedPrecheckRunsByIndex).map(([index, precheckRuns]) => {
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
					duration: duration,
				};
			};
			return {
				index: index,
				name: precheck.index.name,
				status: status,
				prechecks: precheckRuns.map(transformPrecheckRunForUI),
			};
		});
	}
}

export const precheckService = new PrecheckService();

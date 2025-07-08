import { RootFilterQuery, UpdateQuery } from "mongoose";
import { IPrecheck, Precheck } from "../models/precheck.model";
import logger from "../logger/logger";
import { PrecheckStatus } from "../enums";

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
			logger.error(`Error updating status for node ${identifier}: ${error.message}`);
			throw error;
		}
	}

	async getPrecheck(precechGroupId: string) {
		const prechecks = await Precheck.find({ precechGroupId: precechGroupId });
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
}

export const precheckService = new PrecheckService();

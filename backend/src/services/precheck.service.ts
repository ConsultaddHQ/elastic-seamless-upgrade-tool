import { RootFilterQuery, UpdateQuery } from "mongoose";
import { IPrecheck, Precheck } from "../models/precheck.model";
import logger from "../logger/logger";

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
}

export const precheckService = new PrecheckService();

import { IPrecheckGroup, PrecheckGroup } from "../models/precheck-group.model";

class PrecheckGroupService {
	async getLatestGroupByJobId(clusterUpgradeJobId: string): Promise<IPrecheckGroup | null> {
		return await PrecheckGroup.findOne({ clusterUpgradeJobId: clusterUpgradeJobId }).sort({ createdAt: -1 });
	}
}

export const precheckGroupService = new PrecheckGroupService();

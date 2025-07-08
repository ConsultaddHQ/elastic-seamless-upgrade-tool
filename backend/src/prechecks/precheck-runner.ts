import { PrecheckExecutionRequest } from "./types/interfaces";
import { clusterUpgradeJobService } from "../services/cluster-upgrade-job.service";
import { precheckRegistry } from "./precheck-registry";
import { randomUUID } from "crypto";
import { getClusterInfoById } from "../services/cluster-info.service";
import { PrecheckGroup } from "../models/precheck-group.model";
import { PrecheckStatus } from "../enums";

class PrecheckRunner {
	async runAll(clusterUpgradeJobId: string): Promise<void> {
		const groupId = randomUUID();
		await PrecheckGroup.create({
			precheckGroupId: groupId,
			clusterUpgradeJobId: clusterUpgradeJobId,
			status: PrecheckStatus.RUNNING,
		});
		const job = await clusterUpgradeJobService.getClusterUpgradeJobByJobId(clusterUpgradeJobId);
		const cluster = await getClusterInfoById(job.clusterId);
		const defaultRequest: Omit<PrecheckExecutionRequest, "context"> = {
			cluster: cluster,
			upgradeJob: job,
			precheckGroupId: groupId,
		};

		console.log(`Running ${precheckRegistry.getPrechecks().length} prechecks on cluster ${job.clusterId}`);

		for (const precheck of precheckRegistry.getPrechecks()) {
			try {
				await precheck.preExecute({ ...defaultRequest, context: {} });
			} catch (err) {}
		}

		for (const precheck of precheckRegistry.getPrechecks()) {
			try {
				await precheck.execute({ ...defaultRequest, context: {} });
			} catch (err) {}
		}

		await PrecheckGroup.findOneAndUpdate(
			{
				precheckGroupId: groupId,
			},
			{
				status: PrecheckStatus.COMPLETED,
			}
		);
		console.log("✅ All prechecks completed.");
	}
}

export const precheckRunner = new PrecheckRunner();

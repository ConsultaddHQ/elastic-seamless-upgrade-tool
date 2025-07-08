import { PrecheckExecutionRequest } from "./types/interfaces";
import { clusterUpgradeJobService } from "../services/cluster-upgrade-job.service";
import { precheckRegistry } from "./precheck-registry";
import { randomUUID } from "crypto";
import { getClusterInfoById } from "../services/cluster-info.service";

class PrecheckRunner {
	async runAll(clusterUpgradeJobId: string): Promise<void> {
		const groupId = randomUUID(); // Unique precheck group ID
		const job = await clusterUpgradeJobService.getClusterUpgradeJobByJobId(clusterUpgradeJobId);
		const cluster = await getClusterInfoById(job.clusterId);
		const defaultRequest: Omit<PrecheckExecutionRequest, "context"> = {
			cluster: cluster,
			upgradeJob: job,
			precheckGroupId: groupId,
		};

		console.log(`Running ${precheckRegistry.getPrechecks().length} prechecks on cluster ${job.clusterId}`);

		for (const precheck of precheckRegistry.getPrechecks()) {
			const config = precheck.getPrecheckConfig();
			try {
				await precheck.execute({ ...defaultRequest, context: {} });
			} catch (err) {
				console.error(`✖ Failed: ${config.name}`, err);
			}
		}

		console.log("✅ All prechecks completed.");
	}
}

export const precheckRunner = new PrecheckRunner();

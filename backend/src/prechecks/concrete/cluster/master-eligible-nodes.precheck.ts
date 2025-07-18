import { ElasticClient } from "../../../clients/elastic.client";
import { BaseClusterPrecheck } from "../../base/base-cluster-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { ClusterContext, PrecheckExecutionRequest } from "../../types/interfaces";

export class MasterEligibleNodesPrecheck extends BaseClusterPrecheck {
	constructor() {
		super({
			id: "elasticsearch_master_eligible_nodes_check",
			name: "Minimum number of master-eligible nodes",
			type: PrecheckType.CLUSTER,
			mode: ExecutionMode.CODE,
		});
	}

	protected async runForContext(request: PrecheckExecutionRequest<ClusterContext>): Promise<void> {
		const client = await ElasticClient.buildClient(request.cluster.clusterId);
		const es = client.getClient();

		const nodes = await es.cat.nodes({ format: "json", h: "name,node.role" });
		const totalNodes = nodes.length;
		const masterEligibleNodes = nodes.filter((n) => n["node.role"]?.includes("m"));
		const masterCount = masterEligibleNodes.length;

		this.addLog(request, `Found ${masterCount} master-eligible node(s) out of ${totalNodes} total node(s).`);

		const isSmallCluster = totalNodes < 3;

		if (isSmallCluster) {
			this.addLog(
				request,
				`ℹ️ Small cluster detected (${totalNodes} total node${totalNodes > 1 ? "s" : ""}). ` +
					`For production high availability, it's recommended to have at least 3 master-eligible nodes.`
			);
			return;
		}

		if (masterCount % 2 === 0) {
			this.addLog(
				request,
				`⚠️ Even number (${masterCount}) of master-eligible nodes detected. ` +
					`Consider using an odd number (e.g., ${masterCount + 1}) to avoid split-brain scenarios.`
			);
		}

		const quorum = Math.floor(masterCount / 2) + 1;
		const toleratedFailures = masterCount - quorum;

		this.addLog(
			request,
			`🧮 Master quorum requirement: ${quorum} out of ${masterCount} master-eligible nodes. ` +
				`Cluster can tolerate up to ${toleratedFailures} failure(s) and still elect a master.`
		);

		if (masterCount < 3) {
			this.addLog(
				request,
				`❌ Only ${masterCount} master-eligible node${masterCount > 1 ? "s" : ""} detected. ` +
					`This is below the recommended minimum of 3 for safe master elections.`
			);
			throw new Error(
				`Insufficient master-eligible nodes: found ${masterCount}, need at least 3 for high availability.`
			);
		}
	}
}

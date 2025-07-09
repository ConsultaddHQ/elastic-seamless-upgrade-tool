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
		const masterEligible = nodes.filter((n) => n["node.role"]?.includes("m"));
		const count = masterEligible.length;

		this.addLog(request, `Found ${count} master-eligible node(s). Recommended: at least 2.`);

		if (count < 2) {
			throw new Error(`Insufficient master-eligible nodes: found ${count}, need at least 2 for HA.`);
		}
	}
}

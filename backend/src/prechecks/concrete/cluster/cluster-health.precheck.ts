import { ElasticClient } from "../../../clients/elastic.client";
import { BaseClusterPrecheck } from "../../base/base-cluster-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { PrecheckExecutionRequest, ClusterContext } from "../../types/interfaces";

export class ClusterHealthPrecheck extends BaseClusterPrecheck {
	constructor() {
		super({
			id: "elasticsearch_cluster_health_check",
			name: "Cluster health check",
			type: PrecheckType.CLUSTER,
			mode: ExecutionMode.CODE,
		});
	}
	protected async runForContext(request: PrecheckExecutionRequest<ClusterContext>): Promise<void> {
		const client = await ElasticClient.buildClient(request.cluster.clusterId);
		const elasticsearchClient = client.getClient();
		const health = await elasticsearchClient.cluster.health();
		const isHealthy = health.status === "green";

		const message = `Cluster health status: '${health.status}'. Expected: 'green'.`;

		await this.addLog(request, message);

		if (!isHealthy) {
			throw new Error(`Cluster health check failed. ${message}`);
		}
	}
}

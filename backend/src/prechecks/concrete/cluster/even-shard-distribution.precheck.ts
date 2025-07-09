import { ElasticClient } from "../../../clients/elastic.client";
import { BaseClusterPrecheck } from "../../base/base-cluster-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { ClusterContext, PrecheckExecutionRequest } from "../../types/interfaces";

export class EvenShardDistributionPrecheck extends BaseClusterPrecheck {
	constructor() {
		super({
			id: "elasticsearch_even_shard_distribution",
			name: "Even shard distribution across data nodes",
			type: PrecheckType.CLUSTER,
			mode: ExecutionMode.CODE,
		});
	}

	protected async runForContext(request: PrecheckExecutionRequest<ClusterContext>): Promise<void> {
		const client = await ElasticClient.buildClient(request.cluster.clusterId);
		const es = client.getClient();

		const shards = await es.cat.shards({ format: "json", h: "node" });

		const shardCountByNode: Record<string, number> = {};
		for (const s of shards) {
			if (!s.node) continue;
			shardCountByNode[s.node] = (shardCountByNode[s.node] || 0) + 1;
		}

		const nodeShardInfo = Object.entries(shardCountByNode).map(([node, count]) => `${node}: ${count}`);
		await this.addLog(request, `Shard distribution per node:`, ...nodeShardInfo);

		const counts = Object.values(shardCountByNode);
		const max = Math.max(...counts);
		const min = Math.min(...counts);
		const spread = max - min;

		if (spread > 10) {
			throw new Error(
				`Uneven shard distribution detected. Max: ${max}, Min: ${min}, Spread: ${spread}. Expected spread <= 10.`
			);
		}
	}
}

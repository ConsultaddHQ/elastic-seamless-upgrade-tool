import { ElasticClient } from "../../../clients/elastic.client";
import { BaseClusterPrecheck } from "../../base/base-cluster-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { PrecheckExecutionRequest, ClusterContext } from "../../types/interfaces";

export class NoRelocatingShardsPrecheck extends BaseClusterPrecheck {
	constructor() {
		super({
			id: "elasticsearch_no_relocating_shards",
			name: "No relocating shards",
			type: PrecheckType.CLUSTER,
			mode: ExecutionMode.CODE,
		});
	}

	protected async runForContext(request: PrecheckExecutionRequest<ClusterContext>): Promise<void> {
		const client = await ElasticClient.buildClient(request.cluster.clusterId);
		const es = client.getClient();

		const health = await es.cluster.health();
		const relocatingCount = health.relocating_shards;

		this.addLog(request, `Relocating shards count: ${relocatingCount}. Expected: 0.`, "");

		if (relocatingCount > 0) {
			const allShards = await es.cat.shards({ format: "json" });
			const relocatingShards = allShards.filter((s) => s.state === "RELOCATING");

			for (const shard of relocatingShards) {
				await this.addLog(
					request,
					`Relocating shard: index=${shard.index}, shard=${shard.shard}, from=${shard.node}`
				);
			}

			throw new Error(`Relocating shards check failed. ${relocatingCount} shard(s) are currently relocating.`);
		}
	}
}

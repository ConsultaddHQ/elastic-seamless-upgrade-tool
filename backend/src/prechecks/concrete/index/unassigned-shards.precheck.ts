import { ElasticClient } from "../../../clients/elastic.client";
import { AppError } from "../../../errors";
import { BaseIndexPrecheck } from "../../base/base-index-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { IndexContext, PrecheckExecutionRequest } from "../../types/interfaces";

export class UnassignedShardsPrecheck extends BaseIndexPrecheck {
	constructor() {
		super({
			id: "unassigned_shards_check",
			name: "Unassigned or Initializing Shards Check",
			type: PrecheckType.INDEX,
			mode: ExecutionMode.CODE,
		});
	}

	protected async runForContext(request: PrecheckExecutionRequest<IndexContext>): Promise<void> {
		const indexName = request.context.name;
		const client = await ElasticClient.buildClient(request.cluster.clusterId);
		const elasticsearchClient = client.getClient();

		const shardResponse = await elasticsearchClient.cat.shards({
			index: indexName,
			format: "json",
		});

		const unassignedOrInitializingShards = shardResponse.filter(
			(shard: any) => shard.state === "UNASSIGNED" || shard.state === "INITIALIZING"
		);

		if (unassignedOrInitializingShards.length > 0) {
			const shardStates = unassignedOrInitializingShards.map((s) => `${s.shard} (${s.state})`).join(", ");
			throw new AppError(`Index [${indexName}] has unassigned or initializing shards: ${shardStates}`, 400);
		} else {
			await this.addLog(request, `Index [${indexName}] has all shards in assigned and started state.`);
		}
	}
}

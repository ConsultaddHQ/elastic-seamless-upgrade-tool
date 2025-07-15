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

		const unassignedShards = shardResponse.filter((shard: any) => shard.state === "UNASSIGNED");

		const initializingShards = shardResponse.filter((shard: any) => shard.state === "INITIALIZING");

		if (unassignedShards.length > 0 || initializingShards.length > 0) {
			await this.addLog(request, `Index [${indexName}] has unassigned or initializing shards`);
			if (unassignedShards.length > 0) {
				for (const shard of unassignedShards) {
					if (typeof shard.shard === "string") {
						const explainResponse = await elasticsearchClient.cluster.allocationExplain({
							index: indexName,
							shard: parseInt(shard.shard, 10),
							primary: shard.prirep === "p",
						});
						await this.addLog(
							request,
							`Unassigned shard [${shard.shard}] (primary: ${shard.prirep === "p"}) explanation: ${explainResponse.allocate_explanation ?? "No details available"}`,
							""
						);
					}
				}
			}

			throw new Error();
		} else {
			await this.addLog(request, `Index [${indexName}] has all shards in assigned and started state.`);
		}
	}
}

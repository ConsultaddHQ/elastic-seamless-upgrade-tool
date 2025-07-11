import { ElasticClient } from "../../../clients/elastic.client";
import { ConflictError, NotFoundError } from "../../../errors";
import { ClusterNodeType } from "../../../models/cluster-node.model";
import { BaseNodePrecheck } from "../../base/base-node-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { NodeContext, PrecheckExecutionRequest } from "../../types/interfaces";

export class JvmHeapUsagePrecheck extends BaseNodePrecheck {
	private readonly thresholdPercent: number = 75; // Fail if heap usage ≥ 75%

	constructor() {
		super(
			{
				id: "elasticsearch_jvm_heap_usage_check",
				name: "JVM Heap Usage Check",
				type: PrecheckType.NODE,
				mode: ExecutionMode.CODE,
			},
			ClusterNodeType.ELASTIC
		);
	}

	protected async runForContext(request: PrecheckExecutionRequest<NodeContext>): Promise<void> {
		const client = await ElasticClient.buildClient(request.context.node.clusterId);
		const es = client.getClient();

		const nodeId = request.context.node.nodeId;

		const statsResponse = await es.nodes.stats({ node_id: nodeId, metric: "jvm" });

		const nodeStats = statsResponse.nodes[nodeId];
		if (!nodeStats) {
			throw new NotFoundError(`Node with ID ${nodeId} not found`);
		}

		const heapUsed = nodeStats.jvm?.mem?.heap_used_in_bytes;
		const heapMax = nodeStats.jvm?.mem?.heap_max_in_bytes;
		const name = nodeStats.name;

		if (!heapUsed || !heapMax) {
			await this.addLog(request, `${name}: Skipping heap usage check — missing heap data.`);
			return;
		}

		const usedPercent = (heapUsed / heapMax) * 100;
		const heapUsedGB = (heapUsed / 1024 ** 3).toFixed(2);
		const heapMaxGB = (heapMax / 1024 ** 3).toFixed(2);

		await this.addLog(
			request,
			`${name}: Heap used = ${heapUsedGB}GB / ${heapMaxGB}GB (${usedPercent.toFixed(2)}%)`
		);

		if (usedPercent >= this.thresholdPercent) {
			throw new ConflictError(
				`${name}: Heap usage is too high (${usedPercent.toFixed(2)}%). It must be below ${this.thresholdPercent}%.`
			);
		}
	}
}

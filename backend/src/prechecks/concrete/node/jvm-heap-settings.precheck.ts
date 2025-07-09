import { ElasticClient } from "../../../clients/elastic.client";
import { ClusterNodeType } from "../../../models/cluster-node.model";
import { BaseNodePrecheck } from "../../base/base-node-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { PrecheckExecutionRequest, NodeContext } from "../../types/interfaces";

export class JvmHeapSettingsPrecheck extends BaseNodePrecheck {
	constructor() {
		super(
			{
				id: "elasticsearch_jvm_heap_check",
				name: "JVM heap settings check",
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

		const nodesInfo = await es.nodes.info({ node_id: nodeId, metric: "jvm" });

		const node = nodesInfo.nodes[nodeId];
		if (!node) {
			throw new Error(`Node with ID ${nodeId} not found`);
		}

		const name = node.name;
		const heapInit = node.jvm?.mem.heap_init_in_bytes;
		const heapMax = node.jvm?.mem.heap_max_in_bytes;

		if (heapInit && heapMax) {
			const heapInitGB = heapInit / 1024 ** 3;
			const heapMaxGB = heapMax / 1024 ** 3;

			this.addLog(request, `${name}: -Xms=${heapInitGB}GB, -Xmx=${heapMaxGB}GB`);

			if (heapInit !== heapMax) {
				throw new Error(`${name} has mismatched -Xms and -Xmx. Must be equal.`);
			}

			// if (heapMaxGB < 4 || heapMaxGB > 32) {
			// 	throw new Error(`${name} has suspicious heap size: ${heapMaxGB}GB. Recommended: 4–32 GB.`);
			// }
		} else {
			const reason =
				!heapInit && !heapMax
					? `heap_init and heap_max are both missing`
					: !heapInit
						? `heap_init is missing`
						: `heap_max is missing`;

			await this.addLog(request, `${name}: Skipping JVM heap check — ${reason}.`);
		}
	}
}

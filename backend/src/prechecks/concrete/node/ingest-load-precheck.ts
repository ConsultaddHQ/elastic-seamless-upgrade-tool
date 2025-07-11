import { ElasticClient } from "../../../clients/elastic.client";
import { ConflictError, NotFoundError } from "../../../errors";
import { ClusterNodeType } from "../../../models/cluster-node.model";
import { BaseNodePrecheck } from "../../base/base-node-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { NodeContext, PrecheckExecutionRequest } from "../../types/interfaces";

export class IngestLoadPrecheck extends BaseNodePrecheck {
	private readonly throughputThreshold: number = 1000; // Docs/sec

	constructor() {
		super(
			{
				id: "elasticsearch_ingest_load_check",
				name: "Ingest Node Load Check",
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

		const stats = await es.nodes.stats({ node_id: nodeId, metric: "ingest" });

		const node = stats.nodes[nodeId];
		if (!node) {
			throw new NotFoundError(`Node with ID ${nodeId} not found`);
		}

		const name = node.name;
		const ingestTotal = node.ingest?.total;

		if (!ingestTotal || ingestTotal.count === 0 || ingestTotal.time_in_millis === 0) {
			await this.addLog(request, `${name}: Skipping ingest load check — no activity data.`);
			return;
		}

		const docsPerSec = ingestTotal.count / (ingestTotal.time_in_millis / 1000);
		const docsPerSecRounded = docsPerSec.toFixed(2);

		await this.addLog(
			request,
			`${name}: Ingested ${ingestTotal.count} docs in ${ingestTotal.time_in_millis} ms → ~${docsPerSecRounded} docs/sec`
		);

		if (docsPerSec > this.throughputThreshold) {
			throw new ConflictError(
				`${name}: Ingest load is high (${docsPerSecRounded} docs/sec). Threshold: ${this.throughputThreshold} docs/sec.`
			);
		}
	}
}

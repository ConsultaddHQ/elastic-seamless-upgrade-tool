import { ElasticClient } from "../../../clients/elastic.client";
import { ConflictError, NotFoundError } from "../../../errors";
import { ClusterNodeType } from "../../../models/cluster-node.model";
import { BaseNodePrecheck } from "../../base/base-node-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { NodeContext, PrecheckExecutionRequest } from "../../types/interfaces";
export class FileDescriptorLimitPrecheck extends BaseNodePrecheck {
	private readonly minLimit: number = 65535;

	constructor() {
		super(
			{
				id: "elasticsearch_file_descriptor_check",
				name: "File Descriptor Limit Check",
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

		const stats = await es.nodes.stats({ node_id: nodeId, metric: "process" });

		const node = stats.nodes[nodeId];
		if (!node) {
			throw new NotFoundError(`Node with ID ${nodeId} not found`);
		}

		const name = node.name;
		const maxFD = node.process?.max_file_descriptors;
		const openFD = node.process?.open_file_descriptors;

		if (!maxFD || !openFD) {
			await this.addLog(request, `${name}: Skipping file descriptor check — missing metrics.`);
			return;
		}

		const usagePercent = (openFD / maxFD) * 100;

		await this.addLog(
			request,
			`${name}: Open FDs = ${openFD}, Max FDs = ${maxFD} (${usagePercent.toFixed(2)}% in use)`
		);

		if (maxFD < this.minLimit) {
			throw new ConflictError(
				`${name}: Max file descriptor limit (${maxFD}) is below the recommended minimum (${this.minLimit}). Consider increasing 'ulimit -n' and systemd LimitNOFILE.`
			);
		}
	}
}

import { ElasticClient } from "../../../clients/elastic.client";
import { ConflictError, NotFoundError } from "../../../errors";
import { ClusterNodeType } from "../../../models/cluster-node.model";
import { BaseNodePrecheck } from "../../base/base-node-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { NodeContext, PrecheckExecutionRequest } from "../../types/interfaces";

export class ElasticVersionPrecheck extends BaseNodePrecheck {
	private readonly playbookPath: string = "playbooks/pre_checks/elasticsearch-version-check.ansible.yml";
	constructor() {
		super(
			{
				id: "elasticsearch_version_check",
				name: "Elasticsearch Version Check",
				type: PrecheckType.NODE,
				mode: ExecutionMode.CODE,
			},
			ClusterNodeType.ELASTIC
		);
	}

	protected async runForContext(request: PrecheckExecutionRequest<NodeContext>): Promise<void> {
		const currentVersion = request.upgradeJob.currentVersion;
		const client = await ElasticClient.buildClient(request.cluster.clusterId);
		const elasticsearchClient = client.getClient();
		const nodeId = request.context.node.nodeId;
		try {
			const nodes = await elasticsearchClient.nodes.info({
				node_id: nodeId,
			});
			const node = nodes.nodes[nodeId];
			if (node.version === currentVersion) {
				await this.addLog(request, `Node is running on the expected version: ${currentVersion}.`);
			} else {
				const message = `Node version mismatch: expected ${currentVersion}, but found ${node.version}.`;
				throw new ConflictError(message);
			}
		} catch (err) {
			const message = `Node with ID ${nodeId} not found`;
			throw new NotFoundError(message);
		}
	}
}

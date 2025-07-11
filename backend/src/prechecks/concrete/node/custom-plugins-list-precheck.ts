import { ElasticClient } from "../../../clients/elastic.client";
import { ClusterNodeType } from "../../../models/cluster-node.model";
import { BaseNodePrecheck } from "../../base/base-node-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { NodeContext, PrecheckExecutionRequest, PrecheckSeverity } from "../../types/interfaces";

export class CustomPluginsListPrecheck extends BaseNodePrecheck {
	// Common plugins shipped with Elastic distributions
	private readonly bundledPlugins = new Set([
		"x-pack-core",
		"x-pack-security",
		"x-pack-ml",
		"x-pack-monitoring",
		"x-pack-apm",
		"x-pack-logstash",
		"x-pack-deprecation",
		"x-pack-ilm",
		"x-pack-sql",
		"x-pack-rollup",
		"x-pack-stack",
		"x-pack-ccr",
		"x-pack-analytics",
		"repository-gcs",
		"repository-azure",
		"repository-s3",
	]);

	constructor() {
		super(
			{
				id: "custom_plugins_check",
				name: "Manually Installed Plugins Check",
				type: PrecheckType.NODE,
				mode: ExecutionMode.CODE,
				severity: PrecheckSeverity.INFO,
			},
			ClusterNodeType.ELASTIC
		);
	}

	protected async runForContext(request: PrecheckExecutionRequest<NodeContext>): Promise<void> {
		const nodeId = request.context.node.nodeId;
		const client = await ElasticClient.buildClient(request.cluster.clusterId);
		const es = client.getClient();

		const pluginInfo = await es.nodes.info({ node_id: nodeId, metric: "plugins" });
		const node = pluginInfo.nodes[nodeId];

		if (!node) {
			throw new Error(`Node with ID ${nodeId} not found`);
		}
		if (!Array.isArray(node.plugins)) {
			throw new Error(`Plugins information for node [${node.name}] not found or invalid`);
		}
		const installedPlugins: string[] = node.plugins?.map((p: any) => p.name);
		const customPlugins = installedPlugins.filter((name) => !this.bundledPlugins.has(name));

		if (customPlugins.length === 0) {
			await this.addLog(request, `Node [${node.name}] has no manually installed plugins.`);
			return;
		}

		await this.addLog(request, `Node [${node.name}] has manually installed plugins: ${customPlugins.join(", ")}`);
	}
}

import { ElasticClient } from "../../../clients/elastic.client";
import { BaseIndexPrecheck } from "../../base/base-index-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { IndexContext, PrecheckExecutionRequest } from "../../types/interfaces";

export class IndexCreationVersionPrecheck extends BaseIndexPrecheck {
	private readonly supportedMajorVersion = 8;

	constructor() {
		super({
			id: "index_creation_version_check",
			name: "Index Creation Version Check",
			type: PrecheckType.INDEX,
			mode: ExecutionMode.CODE,
		});
	}

	protected async runForContext(request: PrecheckExecutionRequest<IndexContext>): Promise<void> {
		const indexName = request.context.name;
		const client = await ElasticClient.buildClient(request.cluster.clusterId);
		const es = client.getClient();

		const settings = await es.indices.getSettings({ index: indexName });
		const createdVersionStr = settings[indexName]?.settings?.index?.version?.created_string;

		if (!createdVersionStr) {
			await this.addLog(
				request,
				`Index [${indexName}] has no version.created_string — cannot determine creation version.`
			);
			return;
		}

		const createdMajorVersion = parseInt(createdVersionStr.split(".")[0], 10);

		await this.addLog(request, `Index [${indexName}] was created with version ${createdVersionStr}.`);

		if (createdMajorVersion < this.supportedMajorVersion) {
			await this.addLog(
				request,
				`Index [${indexName}] was created with a pre-8.x version (${createdVersionStr}). Consider reindexing for compatibility.`,
				"warning"
			);
		}
	}
}

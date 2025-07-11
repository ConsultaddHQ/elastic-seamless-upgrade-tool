import { ElasticClient } from "../../../clients/elastic.client";
import { BaseIndexPrecheck } from "../../base/base-index-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { IndexContext, PrecheckExecutionRequest, PrecheckSeverity } from "../../types/interfaces";

export class MappedFieldCountPrecheck extends BaseIndexPrecheck {
	private readonly fieldLimit = 1000;

	constructor() {
		super({
			id: "index_mapped_field_count_check",
			name: "Mapped Field Count Check",
			type: PrecheckType.INDEX,
			mode: ExecutionMode.CODE,
			severity: PrecheckSeverity.WARNING,
		});
	}

	private countFields(properties: any, parent = ""): number {
		let count = 0;
		for (const key in properties) {
			const field = properties[key];
			count++;
			if (field.properties) {
				count += this.countFields(field.properties, `${parent}${key}.`);
			}
		}
		return count;
	}

	protected async runForContext(request: PrecheckExecutionRequest<IndexContext>): Promise<void> {
		const indexName = request.context.name;
		const client = await ElasticClient.buildClient(request.cluster.clusterId);
		const es = client.getClient();

		const mapping = await es.indices.getMapping({ index: indexName });
		const properties = mapping[indexName]?.mappings?.properties;

		if (!properties) {
			await this.addLog(request, `Index [${indexName}] has no properties defined.`);
			return;
		}

		const fieldCount = this.countFields(properties);

		await this.addLog(request, `Index [${indexName}] has ${fieldCount} mapped fields.`);

		if (fieldCount > this.fieldLimit) {
			await this.addLog(
				request,
				`Index [${indexName}] exceeds the recommended field count (${fieldCount} > ${this.fieldLimit}). Consider flattening mappings.`,
				"warning"
			);
		}
	}
}

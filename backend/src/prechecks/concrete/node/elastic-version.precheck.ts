import { ClusterNodeType } from "../../../models/cluster-node.model";
import { BaseAnsibleNodePrecheck } from "../../base/base-ansible-node-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { NodeContext, PrecheckExecutionRequest } from "../../types/interfaces";

export class ElasticVersionPrecheck extends BaseAnsibleNodePrecheck {
	private readonly playbookPath: string = "playbooks/pre_checks/elasticsearch-version-check.ansible.yml";
	constructor() {
		super(
			{
				id: "elasticsearch_version_check",
				name: "Elasticsearch Version Check",
				type: PrecheckType.NODE,
				mode: ExecutionMode.ANSIBLE,
			},
			ClusterNodeType.ELASTIC
		);
	}

	protected async runForContext(request: PrecheckExecutionRequest<NodeContext>): Promise<void> {
		await this.runPlaybook(request, {
			playbookPath: this.playbookPath,
		});
	}
}

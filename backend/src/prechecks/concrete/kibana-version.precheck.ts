import { ClusterNodeType } from "../../models/cluster-node.model";
import { BaseAnsibleNodePrecheck } from "../base/base-ansible-node-precheck";
import { ExecutionMode, PrecheckType } from "../types/enums";
import { NodeContext, PrecheckExecutionRequest } from "../types/interfaces";

export class KibanaVersionPrecheck extends BaseAnsibleNodePrecheck {
	private readonly playbookPath: string = "playbooks/pre_checks/kibana-version-check.ansible.yml";
	constructor() {
		super(
			{
				id: "kibana_version_check",
				name: "Kibana Version Check",
				type: PrecheckType.NODE,
				mode: ExecutionMode.ANSIBLE,
			},
			ClusterNodeType.KIBANA
		);
	}

	protected async runForContext(request: PrecheckExecutionRequest<NodeContext>): Promise<void> {
		await this.runPlaybook(request, {
			playbookPath: this.playbookPath,
		});
	}
}

import { BaseAnsibleNodePrecheck } from "../base/base-ansible-node-precheck";
import { ExecutionMode, PrecheckType } from "../types/enums";
import { NodeContext, PrecheckExecutionRequest } from "../types/interfaces";

export class CheckCpuUtilizationPrecheck extends BaseAnsibleNodePrecheck {
	private readonly playbookPath: string = "playbooks/pre_checks/cpu.ansible.yml";
	constructor() {
		super({
			id: "check-cpu-utilization",
			name: "Check CPU Utilization",
			type: PrecheckType.NODE,
			mode: ExecutionMode.ANSIBLE,
		});
	}

	protected async runForContext(request: PrecheckExecutionRequest<NodeContext>): Promise<void> {
		await this.runPlaybook(request, {
			playbookPath: this.playbookPath,
		});
	}
}

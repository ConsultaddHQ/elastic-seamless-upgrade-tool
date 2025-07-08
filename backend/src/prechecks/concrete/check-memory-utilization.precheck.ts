import { BaseAnsibleNodePrecheck } from "../base/base-ansible-node-precheck";
import { ExecutionMode, PrecheckType } from "../types/enums";
import { NodeContext, PrecheckExecutionRequest } from "../types/interfaces";

export class CheckMemorySpacePrecheck extends BaseAnsibleNodePrecheck {
	private readonly playbookPath: string = "playbooks/pre_checks/memory.ansible.yml";
	constructor() {
		super({
			id: "elasticsearch_memory_precheck",
			name: "Memory Utilization Check",
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

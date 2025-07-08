import { BaseAnsibleNodePrecheck } from "../../base/base-ansible-node-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { NodeContext, PrecheckExecutionRequest } from "../../types/interfaces";

export class CheckDiskSpacePrecheck extends BaseAnsibleNodePrecheck {
	private readonly playbookPath: string = "playbooks/pre_checks/disk.ansible.yml";
	constructor() {
		super({
			id: "elasticsearch_disk_precheck",
			name: "Disk Utilization Check",
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

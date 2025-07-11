import { InfrastructureType } from "../../../models/cluster-info.model";
import { BaseAnsibleNodePrecheck } from "../../base/base-ansible-node-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { NodeContext, PrecheckExecutionRequest, PrecheckSeverity } from "../../types/interfaces";

export class CheckCpuUtilizationPrecheck extends BaseAnsibleNodePrecheck {
	private readonly playbookPath: string = "playbooks/pre_checks/cpu.ansible.yml";
	constructor() {
		super({
			id: "elasticsearch_cpu_precheck",
			name: "CPU Utilization check",
			type: PrecheckType.NODE,
			mode: ExecutionMode.ANSIBLE,
		});
	}

	protected async runForContext(request: PrecheckExecutionRequest<NodeContext>): Promise<void> {
		await this.runPlaybook(request, {
			playbookPath: this.playbookPath,
		});
	}

	public async shouldRunFor(request: PrecheckExecutionRequest<NodeContext>): Promise<boolean> {
		return request.cluster.infrastructureType === InfrastructureType.ON_PREMISE;
	}
}

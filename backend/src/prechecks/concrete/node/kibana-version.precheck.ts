import { KibanaClient } from "../../../clients/kibana.client";
import { ConflictError, NotFoundError } from "../../../errors";
import { ClusterNodeType } from "../../../models/cluster-node.model";
import { BaseNodePrecheck } from "../../base/base-node-precheck";
import { ExecutionMode, PrecheckType } from "../../types/enums";
import { NodeContext, PrecheckExecutionRequest } from "../../types/interfaces";

export class KibanaVersionPrecheck extends BaseNodePrecheck {
	private readonly playbookPath: string = "playbooks/pre_checks/kibana-version-check.ansible.yml";
	constructor() {
		super(
			{
				id: "kibana_version_check",
				name: "Kibana Version Check",
				type: PrecheckType.NODE,
				mode: ExecutionMode.CODE,
			},
			ClusterNodeType.KIBANA
		);
	}

	protected async runForContext(request: PrecheckExecutionRequest<NodeContext>): Promise<void> {
		const currentVersion = request.upgradeJob.currentVersion;
		const client = await KibanaClient.buildClient(request.cluster.clusterId);
		const nodeIp = request.context.node.ip;
		try {
			const version = await client.getKibanaVersion(nodeIp);
			if (version === currentVersion) {
				this.addLog(request, `Kibana node is running on the expected version: ${currentVersion}.`);
			} else {
				const message = `Kibana node version mismatch: expected ${currentVersion}, but found ${version}.`;
				this.addLog(request, message);
				throw new ConflictError(message);
			}
		} catch (err) {
			const message = `Node with IP ${nodeIp} not found`;
			this.addLog(request, message);
			throw new NotFoundError(message);
		}
	}
}

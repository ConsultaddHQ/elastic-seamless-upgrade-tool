import { ClusterNodeType } from "../../models/cluster-node.model";
import { ansibleInventoryService } from "../../services/ansible-inventory.service";
import { ansibleRunnerService } from "../../services/ansible-runner.service";
import { NodeContext, PrecheckConfig, PrecheckExecutionRequest } from "../types/interfaces";
import { BaseNodePrecheck } from "./base-node-precheck";

export abstract class BaseAnsibleNodePrecheck extends BaseNodePrecheck {
	constructor(config: PrecheckConfig, nodeType?: ClusterNodeType) {
		super(config, nodeType);
	}

	protected async runPlaybook(
		request: PrecheckExecutionRequest<NodeContext>,
		playbookOptions: {
			playbookPath: string;
			variables?: Record<string, any>;
		}
	) {
		const { cluster, upgradeJob, precheckGroupId, context } = request;
		const { elastic } = cluster;
		const precheckConfig = this.getPrecheckConfig();
		const inventoryPath = ansibleInventoryService.createInventoryForNode({
			node: context.node,
			keyFilename: `SSH_key.pem`,
			sshUser: request.cluster.sshUser,
		});
		const { playbookPath, variables } = playbookOptions;
		await ansibleRunnerService.runPlaybook({
			playbookPath: playbookPath,
			inventoryPath,
			variables: {
				precheck_id: precheckConfig.id,
				elk_version: upgradeJob.targetVersion,
				elasticsearch_uri: elastic.url,
				es_username: elastic.username!!,
				es_password: elastic.password!!,
				cluster_type: "ELASTIC", // Can be removed?
				playbook_run_id: precheckGroupId,
				playbook_run_type: "PRECHECK",
				current_version: upgradeJob.currentVersion,
				...variables,
			},
		});
	}
}

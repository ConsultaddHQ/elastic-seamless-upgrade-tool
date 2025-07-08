import { PrecheckStatus } from "../../enums";
import logger from "../../logger/logger";
import { ClusterNodeType, IClusterNode } from "../../models/cluster-node.model";
import { INodePrecheck, Precheck } from "../../models/precheck.model";
import { ansibleInventoryService } from "../../services/ansible-inventory.service";
import { ansibleRunnerService } from "../../services/ansible-runner.service";
import { clusterNodeService } from "../../services/cluster-node.service";
import { PrecheckType } from "../types/enums";
import { NodeContext, PrecheckConfig, PrecheckExecutionRequest } from "../types/interfaces";
import { BasePrecheck } from "./base-precheck";

export abstract class BaseAnsibleNodePrecheck extends BasePrecheck<PrecheckConfig, NodeContext> {
	private nodeType?: ClusterNodeType;
	constructor(config: PrecheckConfig, nodeType?: ClusterNodeType) {
		super(config);
		this.nodeType = nodeType;
	}
	protected async getNodes(clusterId: string): Promise<IClusterNode[]> {
		return clusterNodeService.getNodes(clusterId, this.nodeType);
	}

	protected abstract runForContext(request: PrecheckExecutionRequest<NodeContext>): Promise<void>;

	protected async run(request: PrecheckExecutionRequest<NodeContext>): Promise<void> {
		const nodes = await this.getNodes(request.cluster.clusterId);
		const config = this.getPrecheckConfig();

		await Promise.allSettled(
			nodes.map(async (node) => {
				const nodeContext: NodeContext = { node: node };
				try {
					await Precheck.updateOne(
						{
							precheckId: config.id,
							precechGroupId: request.precheckGroupId,
							"node.id": node.nodeId,
						},
						{
							status: PrecheckStatus.RUNNING,
							startedAt: Date.now(),
						}
					);

					await this.runForContext({ ...request, context: nodeContext });
					await Precheck.updateOne(
						{
							precheckId: config.id,
							precechGroupId: request.precheckGroupId,
							"node.id": node.nodeId,
						},
						{
							status: PrecheckStatus.COMPLETED,
							endAt: Date.now(),
						}
					);
				} catch (err) {
					await Precheck.updateOne(
						{
							precheckId: config.id,
							precechGroupId: request.precheckGroupId,
							"node.id": node.nodeId,
						},
						{
							status: PrecheckStatus.FAILED,
							endAt: Date.now(),
						}
					);
				}
			})
		);
	}

	protected async preExecute(request: PrecheckExecutionRequest<NodeContext>): Promise<void> {
		const nodes = await this.getNodes(request.cluster.clusterId);
		const config = this.getPrecheckConfig();
		await Precheck.insertMany(
			nodes.map((node) => {
				const nodePrecheck: INodePrecheck = {
					type: PrecheckType.NODE,
					precheckId: config.id,
					name: config.name,
					status: PrecheckStatus.PENDING,
					precechGroupId: request.precheckGroupId,
					clusterUpgradeJobId: request.upgradeJob.jobId,
					node: {
						id: node.nodeId,
						name: node.name,
						ip: node.ip,
					},
					logs: [],
				};
				return nodePrecheck;
			})
		);
	}

	protected async postExecute(request: PrecheckExecutionRequest<NodeContext>): Promise<void> {}

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

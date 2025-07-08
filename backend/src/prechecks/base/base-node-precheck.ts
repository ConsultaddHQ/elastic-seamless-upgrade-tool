import { PrecheckStatus } from "../../enums";
import { ClusterNodeType, IClusterNode } from "../../models/cluster-node.model";
import { INodePrecheck, Precheck } from "../../models/precheck.model";
import { clusterNodeService } from "../../services/cluster-node.service";
import { PrecheckType } from "../types/enums";
import { NodeContext, PrecheckConfig, PrecheckExecutionRequest } from "../types/interfaces";
import { BasePrecheck } from "./base-precheck";

export abstract class BaseNodePrecheck extends BasePrecheck<PrecheckConfig, NodeContext> {
	private nodeType?: ClusterNodeType;
	constructor(config: PrecheckConfig, nodeType?: ClusterNodeType) {
		super(config);
		this.nodeType = nodeType;
	}
	protected async getNodes(clusterId: string): Promise<IClusterNode[]> {
		return clusterNodeService.getNodes(clusterId, this.nodeType);
	}

	protected abstract runForContext(request: PrecheckExecutionRequest<NodeContext>): Promise<void>;

	protected async run(request: PrecheckExecutionRequest<any>): Promise<void> {
		const nodes = await this.getNodes(request.cluster.clusterId);
		const config = this.getPrecheckConfig();

		await Promise.allSettled(
			nodes.map(async (node) => {
				const nodeContext: NodeContext = { node: node };
				const uniquePrecheckIdentifier = {
					precheckId: config.id,
					precechGroupId: request.precheckGroupId,
					"node.id": node.nodeId,
				};
				try {
					await Precheck.updateOne(uniquePrecheckIdentifier, {
						status: PrecheckStatus.RUNNING,
						startedAt: Date.now(),
					});

					await this.runForContext({ ...request, context: nodeContext });

					await Precheck.updateOne(uniquePrecheckIdentifier, {
						status: PrecheckStatus.COMPLETED,
						endAt: Date.now(),
					});
				} catch (err) {
					await Precheck.updateOne(uniquePrecheckIdentifier, {
						status: PrecheckStatus.FAILED,
						endAt: Date.now(),
					});
				}
			})
		);
	}

	protected async preExecute(request: PrecheckExecutionRequest): Promise<void> {
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

	protected async postExecute(request: PrecheckExecutionRequest): Promise<void> {}
}

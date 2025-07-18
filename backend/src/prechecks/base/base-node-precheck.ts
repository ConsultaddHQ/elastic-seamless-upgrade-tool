import { PrecheckStatus } from "../../enums";
import { ClusterNodeType, IClusterNode } from "../../models/cluster-node.model";
import { INodePrecheck, Precheck } from "../../models/precheck.model";
import { clusterNodeService } from "../../services/cluster-node.service";
import { precheckService } from "../../services/precheck.service";
import { PrecheckType } from "../types/enums";
import { NodeContext, PrecheckConfig, PrecheckExecutionRequest, PrecheckSeverity } from "../types/interfaces";
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

	protected async run(request: PrecheckExecutionRequest<NodeContext>): Promise<void> {
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
				} catch (err: any) {
					await this.addLog({ ...request, context: nodeContext }, err?.message);
					await Precheck.updateOne(uniquePrecheckIdentifier, {
						status: PrecheckStatus.FAILED,
						endAt: Date.now(),
					});
				}
			})
		);
	}

	protected async addLog(request: PrecheckExecutionRequest<NodeContext>, ...logs: string[]): Promise<void> {
		await precheckService.addLog(
			{
				precechGroupId: request.precheckGroupId,
				precheckId: this.getPrecheckConfig().id,
				"node.id": request.context.node.nodeId,
			},
			logs
		);
	}

	async preExecute(request: PrecheckExecutionRequest): Promise<void> {
		const nodes = await this.getNodes(request.cluster.clusterId);
		const config = this.getPrecheckConfig();
		await Precheck.insertMany(
			nodes.map((node) => {
				const nodePrecheck: INodePrecheck = {
					type: PrecheckType.NODE,
					precheckId: config.id,
					name: config.name,
					severity: config.severity || PrecheckSeverity.ERROR,
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
}

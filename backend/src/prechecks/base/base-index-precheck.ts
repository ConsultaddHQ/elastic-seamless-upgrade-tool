import { ElasticClient } from "../../clients/elastic.client";
import { PrecheckStatus } from "../../enums";
import { ClusterNodeType, IClusterNode } from "../../models/cluster-node.model";
import { IIndexPrecheck, INodePrecheck, Precheck } from "../../models/precheck.model";
import { clusterNodeService } from "../../services/cluster-node.service";
import { precheckService } from "../../services/precheck.service";
import { PrecheckType } from "../types/enums";
import { IndexContext, PrecheckConfig, PrecheckExecutionRequest } from "../types/interfaces";
import { BasePrecheck } from "./base-precheck";

export abstract class BaseIndexPrecheck extends BasePrecheck<PrecheckConfig, IndexContext> {
	constructor(config: PrecheckConfig) {
		super(config);
	}
	protected async getIndexes(clusterId: string): Promise<string[]> {
		const client = await ElasticClient.buildClient(clusterId);
		return await client.getAllIndexNames();
	}

	protected abstract runForContext(request: PrecheckExecutionRequest<IndexContext>): Promise<void>;

	protected async run(request: PrecheckExecutionRequest<IndexContext>): Promise<void> {
		const indexes = await this.getIndexes(request.cluster.clusterId);
		const config = this.getPrecheckConfig();

		await Promise.allSettled(
			indexes.map(async (index) => {
				const context: IndexContext = { name: index };
				const uniquePrecheckIdentifier = {
					precheckId: config.id,
					precechGroupId: request.precheckGroupId,
					"index.name": index,
				};
				try {
					await Precheck.updateOne(uniquePrecheckIdentifier, {
						status: PrecheckStatus.RUNNING,
						startedAt: Date.now(),
					});

					await this.runForContext({ ...request, context: context });

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

	protected async addLog(request: PrecheckExecutionRequest<IndexContext>, ...logs: string[]): Promise<void> {
		await precheckService.addLog(
			{
				precechGroupId: request.precheckGroupId,
				precheckId: this.getPrecheckConfig().id,
				"index.name": request.context.name,
			},
			logs
		);
	}

	async preExecute(request: PrecheckExecutionRequest): Promise<void> {
		const indexes = await this.getIndexes(request.cluster.clusterId);
		const config = this.getPrecheckConfig();
		await Precheck.insertMany(
			indexes.map((index) => {
				const indexPrecheck: IIndexPrecheck = {
					type: PrecheckType.INDEX,
					precheckId: config.id,
					name: config.name,
					status: PrecheckStatus.PENDING,
					precechGroupId: request.precheckGroupId,
					clusterUpgradeJobId: request.upgradeJob.jobId,
					index: {
						name: index,
					},
					logs: [],
				};
				return indexPrecheck;
			})
		);
	}
}

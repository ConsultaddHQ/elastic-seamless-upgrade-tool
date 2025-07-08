import { PrecheckStatus } from "../../enums";
import { IClusterPrecheck, Precheck } from "../../models/precheck.model";
import { precheckService } from "../../services/precheck.service";
import { PrecheckType } from "../types/enums";
import { ClusterContext, PrecheckConfig, PrecheckExecutionRequest } from "../types/interfaces";
import { BasePrecheck } from "./base-precheck";

export abstract class BaseClusterPrecheck extends BasePrecheck<PrecheckConfig, ClusterContext> {
	constructor(config: PrecheckConfig) {
		super(config);
	}

	protected abstract runForContext(request: PrecheckExecutionRequest<ClusterContext>): Promise<void>;

	protected async run(request: PrecheckExecutionRequest<ClusterContext>): Promise<void> {
		const config = this.getPrecheckConfig();
		const clusterContext: ClusterContext = {};
		const uniquePrecheckIdentifier = {
			precheckId: config.id,
			precechGroupId: request.precheckGroupId,
		};
		try {
			await Precheck.updateOne(uniquePrecheckIdentifier, {
				status: PrecheckStatus.RUNNING,
				startedAt: Date.now(),
			});

			await this.runForContext({ ...request, context: clusterContext });

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
	}

	async preExecute(request: PrecheckExecutionRequest<ClusterContext>): Promise<void> {
		const config = this.getPrecheckConfig();
		const nodePrecheck: IClusterPrecheck = {
			type: PrecheckType.CLUSTER,
			precheckId: config.id,
			name: config.name,
			status: PrecheckStatus.PENDING,
			precechGroupId: request.precheckGroupId,
			clusterUpgradeJobId: request.upgradeJob.jobId,
			logs: [],
		};
		await Precheck.insertOne(nodePrecheck);
	}

	protected async addLog(request: PrecheckExecutionRequest<ClusterContext>, ...logs: string[]): Promise<void> {
		await precheckService.addLog(
			{
				precechGroupId: request.precheckGroupId,
				precheckId: this.getPrecheckConfig().id,
			},
			logs
		);
	}
}

import { IClusterInfo } from "../../models/cluster-info.model";
import { IClusterNode } from "../../models/cluster-node.model";
import { IClusterUpgradeJob } from "../../models/cluster-upgrade-job.model";
import { ExecutionMode, PrecheckType } from "./enums";

export enum PrecheckSeverity {
	INFO = "info",
	WARNING = "warning",
	ERROR = "error",
}

export interface PrecheckConfig {
	id: string;
	name: string;
	type: PrecheckType;
	mode: ExecutionMode;
	severity?: PrecheckSeverity;
}

export interface AnsiblePrecheckConfig extends PrecheckConfig {
	playbookPath: string;
}
export interface Context {}

export interface NodeContext extends Context {
	node: IClusterNode;
}

export interface IndexContext extends Context {
	name: string;
}

export interface ClusterContext extends Context {}

export interface PrecheckExecutionRequest<TContext = Context> {
	cluster: IClusterInfo;
	upgradeJob: IClusterUpgradeJob;
	precheckGroupId: string;
	context: TContext;
}

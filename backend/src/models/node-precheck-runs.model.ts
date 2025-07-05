import mongoose, { Schema, Document } from "mongoose";
import { PrecheckStatus } from "../enums";

export interface INodePrecheckRun {
	ip: string;
	nodeId: string;
	nodeName: string;
	precheckId: string;
	precheckRunId: string;
	startedAt: Date;
	clusterUpgradeJobId: string;
	endAt?: Date;
	status: PrecheckStatus;
	logs: string[];
}

export interface INodePrecheckRunDocument extends INodePrecheckRun, Document {}

const NodePrecheckRunSchema: Schema<INodePrecheckRunDocument> = new Schema<INodePrecheckRunDocument>(
	{
		ip: { type: String, required: true },
		precheckId: { type: String, required: true },
		precheckRunId: { type: String, required: true },
		clusterUpgradeJobId: { type: String, required: true },
		startedAt: { type: Date, required: true },
		endAt: { type: Date, required: false },
		logs: { type: [String], required: true },
		nodeId: { type: String, required: false },
		nodeName: { type: String, required: false },
		status: {
			type: String,
			required: true,
			enum: [PrecheckStatus.PENDING, PrecheckStatus.RUNNING, PrecheckStatus.FAILED, PrecheckStatus.COMPLETED],
			default: PrecheckStatus.PENDING,
		},
	},

	{ timestamps: true }
);

export const NodePrecheckRun = mongoose.model<INodePrecheckRunDocument>("node-precheck-runs", NodePrecheckRunSchema);

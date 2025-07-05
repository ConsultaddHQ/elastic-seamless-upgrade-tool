import mongoose, { Schema, Document } from "mongoose";

export enum ClusterUpgradeJobStatus {
	PENDING = "pending",
	IN_PROGRESS = "in_progress",
	COMPLETED = "completed",
	FAILED = "failed",
}
export interface IClusterUpgradeJob {
	jobId: string;
	clusterId: string;
	status: ClusterUpgradeJobStatus;
	currentVersion: string;
	targetVersion: string;
}

export interface IClusterUpgradeJobDocument extends IClusterUpgradeJob, Document {}

const ClusterUpgradeJobSchema: Schema<IClusterUpgradeJobDocument> = new Schema<IClusterUpgradeJobDocument>(
	{
		jobId: { type: String, required: true, unique: true, index: true },
		clusterId: { type: String, required: true, index: true },
		currentVersion: { type: String, required: true },
		targetVersion: { type: String, required: true },
		status: {
			type: String,
			required: true,
			enum: Object.values(ClusterUpgradeJobStatus),
			default: ClusterUpgradeJobStatus.PENDING,
		},
	},
	{ timestamps: true }
);

ClusterUpgradeJobSchema.index({ clusterId: 1, currentVersion: 1 }, { unique: true });

export const ClusterUpgradeJob = mongoose.model<IClusterUpgradeJobDocument>(
	"ClusterUpgradeJob",
	ClusterUpgradeJobSchema,
	"cluster-upgrade-jobs"
);

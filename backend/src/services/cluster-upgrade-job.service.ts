import { randomUUID } from "crypto";
import { ConflictError, NotFoundError } from "../errors";
import { ClusterUpgradeJob, ClusterUpgradeJobStatus, IClusterUpgradeJob } from "../models/cluster-upgrade-job.model";
import { NodeStatus } from "../enums";
import logger from "../logger/logger";
import { clusterNodeService } from "./cluster-node.service";

class ClusterUpgradeJobService {
	async getActiveClusterUpgradeJobByClusterId(clusterId: string): Promise<IClusterUpgradeJob> {
		const job = await ClusterUpgradeJob.findOne({ clusterId, status: { $ne: "completed" } });
		if (!job) {
			logger.error(`No active upgrade job found for clusterId: ${clusterId}`);
			throw new NotFoundError(`No upgrade job found for clusterId: ${clusterId}`);
		}
		return job;
	}

	async getLatestClusterUpgradeJobByClusterId(clusterId: string): Promise<IClusterUpgradeJob | null> {
		return await ClusterUpgradeJob.findOne({ clusterId }).sort({ createdAt: -1 });
	}

	async getClusterUpgradeJobByJobId(jobId: string): Promise<IClusterUpgradeJob> {
		const job = await ClusterUpgradeJob.findOne({ jobId: jobId });
		if (!job) {
			logger.error(`No upgrade job found for jobId: ${jobId}`);
			throw new NotFoundError(`No upgrade job found for jobId: ${jobId}`);
		}
		return job;
	}

	async createClusterUpgradeJob(jobData: Omit<IClusterUpgradeJob, "jobId" | "status">): Promise<IClusterUpgradeJob> {
		const existingJob = await ClusterUpgradeJob.findOne({
			clusterId: jobData.clusterId,
			status: { $ne: "completed" },
		});
		if (existingJob) {
			logger.error(`An active upgrade job already exists for clusterId: ${jobData.clusterId}`);
			throw new ConflictError(`An active upgrade job already exists for clusterId: ${jobData.clusterId}`);
		}
		const newJob = new ClusterUpgradeJob({
			jobId: randomUUID(),
			clusterId: jobData.clusterId,
			currentVersion: jobData.currentVersion,
			targetVersion: jobData.targetVersion,
			status: "pending",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		await newJob.save();
		// Reset the status and progress of all nodes in the cluster
		await clusterNodeService.updateNodesPartially(
			{ clusterId: jobData.clusterId },
			{ status: NodeStatus.AVAILABLE, progress: 0 }
		);
		logger.info(`Created new cluster upgrade job with ID: ${newJob.jobId} for clusterId: ${jobData.clusterId}`);
		return newJob;
	}

	async updateClusterUpgradeJob(
		identifier: Partial<IClusterUpgradeJob>,
		updatedJobValues: Partial<IClusterUpgradeJob>
	): Promise<IClusterUpgradeJob> {
		const updatedJob = await ClusterUpgradeJob.findOneAndUpdate(identifier, { $set: updatedJobValues });
		if (!updatedJob) {
			throw new NotFoundError(`Cluster upgrade job with identifier ${JSON.stringify(identifier)} not found`);
		}
		return updatedJob;
	}

	async clusterUpgradeJobCompleted(jobId: string): Promise<void> {
		await this.updateClusterUpgradeJob({ jobId: jobId }, { status: ClusterUpgradeJobStatus.COMPLETED });
	}
}

export const clusterUpgradeJobService = new ClusterUpgradeJobService();

import mongoose, { Schema, Document } from "mongoose";
import { clusterStatus } from "../enums";

export interface IElasticSearchInfo {
	clusterId: string;
	clusterName: string;
	clusterUUID: string;
	status: clusterStatus;
	version: string;
	timedOut: Boolean;
	numberOfDataNodes: number;
	numberOfMasterNodes: number;
	totalIndices: number;
	numberOfNodes: number;
	currentMasterNode: string;
	activePrimaryShards: number;
	activeShards: number;
	unassignedShards: number;
	initializingShards: number;
	relocatingShards: number;
	lastSyncedAt: Date;
	adaptiveReplicationEnabled: boolean;
}

export interface IElasticSearchInfoDocument extends IElasticSearchInfo, Document {}

const ElasticSearchInfoSchema: Schema<IElasticSearchInfoDocument> = new Schema<IElasticSearchInfoDocument>(
	{
		clusterId: { type: String, required: true, unique: true },
		clusterName: { type: String, required: true },
		clusterUUID: { type: String, required: true },
		status: { type: String, required: true },
		version: { type: String, required: true },
		timedOut: { type: Number, required: true },
		numberOfDataNodes: { type: Number, required: true },
		numberOfMasterNodes: { type: Number, required: true },
		currentMasterNode: { type: String },
		numberOfNodes: { type: Number, required: true },
		activePrimaryShards: { type: Number, required: true },
		activeShards: { type: Number, required: true },
		unassignedShards: { type: Number, required: true },
		initializingShards: { type: Number, required: true },
		relocatingShards: { type: Number, required: true },
		lastSyncedAt: { type: Date, required: true },
		totalIndices: { type: Number, required: true },
		adaptiveReplicationEnabled: { type: Boolean },
	},
	{ timestamps: true }
);

const ElasticSearchInfo = mongoose.model<IElasticSearchInfo>(
	"ElasticSearchInfo",
	ElasticSearchInfoSchema,
	"elastic-search-infos"
);

export default ElasticSearchInfo;

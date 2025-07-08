import mongoose, { Schema, Document } from "mongoose";
import { PrecheckStatus } from "../enums";
import { PrecheckType } from "../prechecks/types/enums";

export enum ClusterNodeType {
	KIBANA = "kibana",
	ELASTIC = "elastic",
}

interface IBasePrecheck {
	precheckId: string;
	name: string;
	type: PrecheckType;
	precechGroupId: string;
	clusterUpgradeJobId: string;
	status: PrecheckStatus;
	logs: string[];
	startedAt?: Date;
	endAt?: Date;
}

export interface INodePrecheck extends IBasePrecheck {
	type: PrecheckType.NODE;
	node: {
		id: string;
		name: string;
		ip: string;
	};
}

export interface IClusterPrecheck extends IBasePrecheck {
	type: PrecheckType.CLUSTER;
}

export interface IIndexPrecheck extends IBasePrecheck {
	type: PrecheckType.INDEX;
	index: {
		name: string;
	};
}

export type IPrecheck = IClusterPrecheck | INodePrecheck | IIndexPrecheck;

export type IPrecheckDocument = IPrecheck & Document;

/**
 * Schema definition
 */
const PrecheckSchema: Schema<IPrecheckDocument> = new Schema<IPrecheckDocument>({
	precheckId: { type: String, required: true },
	name: { type: String, required: true },
	clusterUpgradeJobId: { type: String, required: true },
	type: { type: String, enum: Object.values(PrecheckType), required: true },
	precechGroupId: { type: String, required: true },
	status: { type: String, enum: Object.values(PrecheckStatus), required: true, default: PrecheckStatus.PENDING },
	startedAt: { type: Date },
	endAt: { type: Date },
	node: {
		id: { type: String },
		name: { type: String },
		ip: { type: String },
	},
	index: {
		name: { type: String },
	},
	logs: { type: [String], required: true, default: [] },
});

export const Precheck = mongoose.model<IPrecheckDocument>("Precheck", PrecheckSchema, "prechecks");

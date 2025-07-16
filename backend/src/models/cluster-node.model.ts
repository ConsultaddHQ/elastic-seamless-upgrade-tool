import mongoose, { Schema, Document } from "mongoose";
import { NodeStatus } from "../enums";

export enum ClusterNodeType {
	KIBANA = "kibana",
	ELASTIC = "elastic",
}

/**
 * Shared fields for all nodes
 */
export interface ICommonFields {
	nodeId: string;
	clusterId: string;
	name: string;
	version: string;
	ip: string;
	roles: string[];
	os: Record<string, any>;
	progress?: number;
	status: NodeStatus;
	type: ClusterNodeType;
	rank: number;
}

/**
 * Specific Kibana node
 */
export interface IKibanaNode extends ICommonFields {
	type: ClusterNodeType.KIBANA;
}

/**
 * Specific Elastic node
 */
export interface IElasticNode extends ICommonFields {
	type: ClusterNodeType.ELASTIC;
	isMaster: boolean;
}

/**
 * Union of both
 */
export type IClusterNode = IKibanaNode | IElasticNode;

export type IClusterNodeDocument = IClusterNode & Document;

/**
 * Schema definition
 */
const ClusterNodeSchema: Schema<IClusterNodeDocument> = new Schema<IClusterNodeDocument>(
	{
		nodeId: { type: String, required: true, unique: true, index: true },
		clusterId: { type: String, required: true, index: true },
		name: { type: String, required: true, unique: true },
		version: { type: String, required: true },
		ip: { type: String, required: true },
		roles: { type: [String], required: true },
		os: { type: Object, required: true },
		progress: { type: Number },
		rank: { type: Number, required: true },
		status: {
			type: String,
			enum: Object.values(NodeStatus),
			default: NodeStatus.AVAILABLE,
			required: true,
		},
		type: {
			type: String,
			enum: ["elastic", "kibana"],
			required: true,
		},
		isMaster: {
			type: Boolean,
			required: function (this: IClusterNodeDocument) {
				return this.type === "elastic";
			},
		},
	},
	{ timestamps: true }
);

export const ClusterNode = mongoose.model<IClusterNodeDocument>("ClusterNode", ClusterNodeSchema, "cluster-nodes");

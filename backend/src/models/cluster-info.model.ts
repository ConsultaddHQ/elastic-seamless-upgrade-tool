import mongoose, { Schema, Document } from "mongoose";

export enum InfrastructureType {
	ON_PREMISE = "on-premise",
	ON_CLOUD = "on-cloud",
}
export interface IElasticInfo {
	url: string;
	apiKey?: string;
	username?: string;
	password?: string;
	bearer?: string;
}

export interface IKibanaInfo {
	url: string;
	apiKey?: string;
	username?: string;
	password?: string;
	bearer?: string;
}

export interface IClusterInfo {
	clusterId: string;
	elastic: IElasticInfo;
	kibana: IKibanaInfo;
	certificateIds?: string[];
	infrastructureType?: InfrastructureType;
	sshUser: string;
	pathToKey?: string;
	key?: string;
	kibanaConfigs?: Object[] | undefined;
}

export interface IClusterInfoDocument extends IClusterInfo, Document {}

const ElasticInfoSchema: Schema<IElasticInfo> = new Schema<IElasticInfo>({
	url: { type: String, required: true },
	apiKey: { type: String },
	username: { type: String },
	password: { type: String },
	bearer: { type: String },
});

const KibanaInfoSchema: Schema<IElasticInfo> = new Schema<IKibanaInfo>({
	url: { type: String, required: true },
	apiKey: { type: String },
	username: { type: String },
	password: { type: String },
	bearer: { type: String },
});

const ClusterInfoSchema: Schema<IClusterInfoDocument> = new Schema<IClusterInfoDocument>(
	{
		clusterId: { type: String, required: true, unique: true, index: true },
		elastic: { type: ElasticInfoSchema, required: true },
		kibana: { type: KibanaInfoSchema, required: false },
		certificateIds: { type: Array<String>, required: false },
		infrastructureType: { type: String, enum: Object.values(InfrastructureType), required: true },
		pathToKey: { type: String },
		key: { type: String },
		sshUser: { type: String, required: true, default: "root" },
		kibanaConfigs: { type: [Object] },
	},
	{ timestamps: true }
);

export const ClusterInfo = mongoose.model<IClusterInfoDocument>("ClusterInfo", ClusterInfoSchema, "cluster-infos");

import mongoose, { Schema, Document } from 'mongoose';

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
  targetVersion?: string;
  infrastructureType?: string;
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

const ClusterInfoSchema: Schema<IClusterInfoDocument> =
  new Schema<IClusterInfoDocument>(
    {
      clusterId: { type: String, required: true, unique: true },
      elastic: { type: ElasticInfoSchema, required: true },
      kibana: { type: KibanaInfoSchema, required: false },
      certificateIds: { type: Array<String>, required: false },
      infrastructureType: {type: String,required: true},
      targetVersion: { type: String },
      pathToKey: {type: String},
      key: {type: String},
      kibanaConfigs: { type: [Object]}
    },
    { timestamps: true },
  );

// Create the model
const ClusterInfo = mongoose.model<IClusterInfoDocument>(
  'ClusterInfo',
  ClusterInfoSchema,
);

export default ClusterInfo;

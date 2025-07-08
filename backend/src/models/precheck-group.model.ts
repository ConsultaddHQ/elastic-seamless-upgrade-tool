import mongoose, { Schema, Document } from "mongoose";
import { PrecheckStatus } from "../enums";

export interface IPrecheckGroup {
	precheckGroupId: string;
	clusterUpgradeJobId: string;
	status: PrecheckStatus;
}

export type IPrecheckGroupDocument = IPrecheckGroup & Document;

const PrecheckGroupSchema: Schema<IPrecheckGroupDocument> = new Schema<IPrecheckGroupDocument>(
	{
		precheckGroupId: { type: String, required: true },
		clusterUpgradeJobId: { type: String, required: true },
		status: { type: String, enum: Object.values(PrecheckStatus), required: true, default: PrecheckStatus.PENDING },
	},
	{ timestamps: true }
);

export const PrecheckGroup = mongoose.model<IPrecheckGroupDocument>(
	"PrecheckGroup",
	PrecheckGroupSchema,
	"precheck-groups"
);

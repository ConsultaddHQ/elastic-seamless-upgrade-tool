import { ClusterNodeType, IClusterNode } from "../models/cluster-node.model";

export const getNodeRank = (node: IClusterNode): number => {
	const roles = node.roles || [];
	const isMaster = roles.includes("master");
	const isData = roles.includes("data");
	const isActiveMaster = node.type === ClusterNodeType.ELASTIC && node.isMaster;

	if (isActiveMaster) return 50; // Active highest rank
	if (isMaster && !isData) return 40; // master
	if (isMaster && isData) return 30; // master + data
	if (!isMaster && isData) return 20; // only data
	return 10; // others → lowest rank
};

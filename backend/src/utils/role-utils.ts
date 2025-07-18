export const getNodeRankByRoles = (roles: string[], isActiveMaster?: boolean): number => {
	const isMaster = roles.includes("master");
	const isData = roles.includes("data");
	if (isActiveMaster) return 50; // Active highest rank
	if (isMaster && !isData) return 40; // master
	if (isMaster && isData) return 30; // master + data
	if (!isMaster && isData) return 20; // only data
	return 10; // others → lowest rank
};

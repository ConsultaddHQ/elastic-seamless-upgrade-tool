export enum ClusterType {
	KIBANA = "KIBANA",
	ELASTIC = "ELASTIC",
}

export enum AnsibleRequestType {
	UPGRADE = "UPGRADE",
	PRECHECK = "PRECHECK",
}

export enum AnsibleTaskStatus {
	STARTED = "STARTED",
	SUCCESS = "SUCCESS",
	FAILED = "FAILED",
}

export enum NodeStatus {
	UPGRADING = "upgrading",
	AVAILABLE = "available",
	UPGRADED = "upgraded",
	FAILED = "failed",
}

export enum clusterStatus {
	green = "green",
	yellow = "yellow",
	red = "red",
}
export enum PrecheckStatus {
	PENDING = "PENDING",
	RUNNING = "RUNNING",
	FAILED = "FAILED",
	COMPLETED = "COMPLETED",
}

export const mapAnsibleToPrecheckStatus = (ansibleStatus: AnsibleTaskStatus): PrecheckStatus => {
	switch (ansibleStatus) {
		case AnsibleTaskStatus.STARTED:
			return PrecheckStatus.RUNNING;
		case AnsibleTaskStatus.SUCCESS:
			return PrecheckStatus.COMPLETED;
		case AnsibleTaskStatus.FAILED:
			return PrecheckStatus.FAILED;
		default:
			return PrecheckStatus.RUNNING;
	}
};

export const mapAnsibleToUpgradeStatus = (ansibleStatus: AnsibleTaskStatus): NodeStatus => {
	switch (ansibleStatus) {
		case AnsibleTaskStatus.STARTED:
			return NodeStatus.UPGRADING;
		case AnsibleTaskStatus.SUCCESS:
			return NodeStatus.UPGRADED;
		case AnsibleTaskStatus.FAILED:
			return NodeStatus.FAILED;
		default:
			return NodeStatus.UPGRADING;
	}
};

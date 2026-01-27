type TPrecheckStatus = "PENDING" | "RUNNING" | "FAILED" | "COMPLETED"

type TCheckTab = "CLUSTER" | "NODES" | "INDEX" | "BREAKING_CHANGES"

type SEVERITY = "ERROR" | "WARNING" | "INFO" | "SKIPPED"

type TNodeData = {
	nodeId: string
	ip: string
	name: string
	status: TPrecheckStatus
	prechecks: TPrecheck[]
}

type TGroupedPrecheck = {
	id: string
	name: string
	severity: SEVERITY
	status: TPrecheckStatus
	prechecks: TPrecheck[]
}

type TPrecheck = {
	id: string
	name: string
	status: TPrecheckStatus
	severity: SEVERITY
	duration: string
	logs: string[]
	startTime: string
	endTime?: string
	skippable: boolean
}

type TIndexData = {
	index: string
	name: string
	status: TPrecheckStatus
	prechecks: TPrecheck[]
}

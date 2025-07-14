type PrecheckStatus = "PENDING" | "RUNNING" | "FAILED" | "COMPLETED"

type TNodeData = {
	nodeId: string
	ip: string
	name: string
	status: PrecheckStatus
	prechecks: TPrecheck[]
}

type TPrecheck = {
	id: string
	name: string
	status: PrecheckStatus
	duration: string
	logs: string[]
	startTime: string
	endTime?: string
}

type TIndexData = {
	index: string
	name: string
	status: PrecheckStatus
	prechecks: TPrecheck[]
}

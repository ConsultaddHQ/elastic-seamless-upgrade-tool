type TUpgradeRow = {
	status: string
	progress: number | undefined
	key: string
	node_name: string
	role: string
	os: string
	version: string
	action?: null
	isMaster: boolean
	disabled: boolean
	ip: string
}

type TUpgradeColumn = Array<{
	key: string
	label: string
	align: "start" | "center" | "end" | undefined
	width: number
}>

type TUpgradeCluster = { clusterType: "ELASTIC" | "KIBANA" }

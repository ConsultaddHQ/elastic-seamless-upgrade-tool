type UpgradeRowType = {
	status: string
	progress: number | undefined
	key: string
	node_name: string
	role: string
	os: string
	version: string
	action?: null
}
type UpgradeColumnType = Array<{
	key: string
	label: string
	align: "start" | "center" | "end" | undefined
	width: number
}>

type UpgradeClusterType = { clusterType: "ELASTIC" | "KIBANA" }

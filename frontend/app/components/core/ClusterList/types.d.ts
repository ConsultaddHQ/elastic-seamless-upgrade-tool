type TClusterRow = {
	id: string
	name: string
	type: "SELF_MANAGED" | "ELASTIC_CLOUD"
	typeDisplayName: string
	version: string
	status: string
}

type TStatusColorMap = {
	[Key: string]: {
		background: string
		color: string
	}
}

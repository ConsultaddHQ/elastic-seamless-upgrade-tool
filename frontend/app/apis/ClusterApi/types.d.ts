type Clusters = Cluster[]
interface Cluster {
	id: string
	name: string
	type: "SELF_MANAGED" | "ELASTIC_CLOUD"
	typeDisplayName: string
	version: string
	status: string
}

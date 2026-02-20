type Clusters = Cluster[]
interface Cluster {
	id: string
	name: string
	type: "SELF_MANAGED" | "ELASTIC_CLOUD"
	typeDisplayName: string
	version: string
	status: string
}

interface IAllocationExplain {
	index: string
	shard: string
	explanation: string
	fullExplanation: string[]
}

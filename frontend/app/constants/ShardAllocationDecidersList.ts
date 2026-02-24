interface IDeciderInfo {
	cause: string
	fix: string
}

// Define the Decider Mapping Dictionary
export const DECIDER_EXPLANATIONS: Record<string, IDeciderInfo> = {
	same_shard: {
		cause: "A copy of this shard already exists on the target node, so another copy cannot be allocated there.",
		fix: "Add more nodes to the cluster or reduce the number of replicas (index.number_of_replicas).",
	},
	disk_threshold: {
		cause: "The target node does not have enough free disk space to safely allocate this shard.",
		fix: "Free disk space or adjust cluster.routing.allocation.disk.watermark.low/high/flood_stage.",
	},
	filter: {
		cause: "Node does not match index routing allocation filters.",
		fix: "Verify index.routing.allocation.include/exclude/require settings.",
	},
	awareness: {
		cause: "Shard allocation is blocked to preserve rack/zone awareness and maintain fault tolerance.",
		fix: "Ensure you have enough nodes in different awareness zones/racks to balance the replicas.",
	},
	replica_after_primary_active: {
		cause: "Replica allocation is delayed because the primary shard is not yet active.",
		fix: "Wait for the primary shard to fully initialize. If the primary is stuck, troubleshoot it first.",
	},
	throttling: {
		cause: "Shard allocation is temporarily throttled because the node is handling too many recoveries.",
		fix: "Wait for current recoveries to finish, or temporarily increase cluster.routing.allocation.node_concurrent_recoveries.",
	},
	node_version: {
		cause: "Shard cannot be allocated because the target node is running an incompatible or older version.",
		fix: "Ensure nodes are fully upgraded. Replicas cannot be allocated to nodes running an older version than the primary.",
	},
	enable: {
		cause: "Shard allocation is disabled by cluster-level or index-level allocation settings.",
		fix: "Set cluster.routing.allocation.enable to 'all' (via _cluster/settings) to re-enable allocation.",
	},
	shards_limit: {
		cause: "The target node has reached the maximum allowed number of shards for this index.",
		fix: "Increase index.routing.allocation.total_shards_per_node or add more nodes to the cluster.",
	},
	allocation_same_shard: {
		cause: "Another copy of this shard already exists on the node.",
		fix: "Allocate the shard to a different node.",
	},
}

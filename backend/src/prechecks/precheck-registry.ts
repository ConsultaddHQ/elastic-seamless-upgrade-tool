import { ConflictError } from "../errors";
import { BasePrecheck } from "./base/base-precheck";
import { CheckCpuUtilizationPrecheck } from "./concrete/os/check-cpu-utilization.precheck";
import { CheckDiskSpacePrecheck } from "./concrete/os/check-disk-space.precheck";
import { CheckMemoryUtilizationPrecheck } from "./concrete/os/check-memory-utilization.precheck";
import { ClusterHealthPrecheck } from "./concrete/cluster/cluster-health.precheck";
import { ElasticVersionPrecheck } from "./concrete/node/elastic-version.precheck";
import { KibanaVersionPrecheck } from "./concrete/node/kibana-version.precheck";
import { UnassignedShardsPrecheck } from "./concrete/index/unassigned-shards.precheck";
import { NoRelocatingShardsPrecheck } from "./concrete/cluster/no-relocating-shards.precheck";
import { MasterEligibleNodesPrecheck } from "./concrete/cluster/master-eligible-nodes.precheck";
import { EvenShardDistributionPrecheck } from "./concrete/cluster/even-shard-distribution.precheck";
import { JvmHeapSettingsPrecheck } from "./concrete/node/jvm-heap-settings.precheck";
import { JvmHeapUsagePrecheck } from "./concrete/node/jvm-heap-usage-precheck";
import { FileDescriptorLimitPrecheck } from "./concrete/node/file-descriptor-limit-precheck";
import { MappedFieldCountPrecheck } from "./concrete/index/mapped-field-count-precheck";

class PrecheckRegistry {
	private prechecks: BasePrecheck[] = [];

	register(precheck: BasePrecheck): void {
		if (this.prechecks.some((p) => p.getPrecheckConfig().id === precheck.getPrecheckConfig().id)) {
			throw new ConflictError(`Precheck with ID ${precheck.getPrecheckConfig().id} is already registered.`);
		}
		this.prechecks.push(precheck);
	}

	getPrechecks(): BasePrecheck[] {
		return [...this.prechecks];
	}
}

export const precheckRegistry = new PrecheckRegistry();

// Cluster checks
precheckRegistry.register(new ClusterHealthPrecheck());
precheckRegistry.register(new NoRelocatingShardsPrecheck());
precheckRegistry.register(new MasterEligibleNodesPrecheck());
precheckRegistry.register(new EvenShardDistributionPrecheck());

precheckRegistry.register(new ElasticVersionPrecheck());
precheckRegistry.register(new KibanaVersionPrecheck());
precheckRegistry.register(new JvmHeapSettingsPrecheck());
precheckRegistry.register(new JvmHeapUsagePrecheck());
precheckRegistry.register(new FileDescriptorLimitPrecheck());

//Index Level
precheckRegistry.register(new UnassignedShardsPrecheck());
precheckRegistry.register(new MappedFieldCountPrecheck());

// OS Level checks
precheckRegistry.register(new CheckDiskSpacePrecheck());
precheckRegistry.register(new CheckCpuUtilizationPrecheck());
precheckRegistry.register(new CheckMemoryUtilizationPrecheck());

import { ConflictError } from "../errors";
import { BasePrecheck } from "./base/base-precheck";
import { CheckCpuUtilizationPrecheck } from "./concrete/os/check-cpu-utilization.precheck";
import { CheckDiskSpacePrecheck } from "./concrete/os/check-disk-space.precheck";
import { CheckMemoryUtilizationPrecheck } from "./concrete/os/check-memory-utilization.precheck";
import { ClusterHealthPrecheck } from "./concrete/cluster/cluster-health.precheck";
import { ElasticVersionPrecheck } from "./concrete/node/elastic-version.precheck";
import { KibanaVersionPrecheck } from "./concrete/node/kibana-version.precheck";

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

precheckRegistry.register(new CheckDiskSpacePrecheck());
precheckRegistry.register(new CheckCpuUtilizationPrecheck());
precheckRegistry.register(new ElasticVersionPrecheck());
precheckRegistry.register(new KibanaVersionPrecheck());
precheckRegistry.register(new ClusterHealthPrecheck());
precheckRegistry.register(new CheckMemoryUtilizationPrecheck());

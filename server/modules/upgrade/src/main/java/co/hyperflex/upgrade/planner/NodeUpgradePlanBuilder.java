package co.hyperflex.upgrade.planner;

import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.upgrade.tasks.Task;
import java.util.List;

public interface NodeUpgradePlanBuilder {
  boolean supports(ClusterNodeEntity node);

  List<Task> buildPlan(ClusterNodeEntity node, ClusterUpgradeJobEntity upgradeJob);
}

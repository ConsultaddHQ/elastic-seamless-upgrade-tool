package co.hyperflex.upgrade.planner;

import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.upgrade.tasks.Task;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class UpgradePlanBuilder {
  private final Set<NodeUpgradePlanBuilder> builders;

  public UpgradePlanBuilder(Set<NodeUpgradePlanBuilder> builders) {
    this.builders = builders;
  }

  public List<Task> buildPlanFor(ClusterNodeEntity node, ClusterUpgradeJobEntity upgradeJob) {
    return builders.stream()
        .filter(b -> b.supports(node))
        .findFirst()
        .orElseThrow(() -> new UnsupportedOperationException("Unsupported node type: " + node.getType()))
        .buildPlan(node, upgradeJob);
  }
}

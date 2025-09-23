package co.hyperflex.upgrade.planner.kibana;

import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.upgrade.planner.NodeUpgradePlanBuilder;
import co.hyperflex.upgrade.planner.common.RepositoryPreparationStep;
import co.hyperflex.upgrade.tasks.Task;
import co.hyperflex.upgrade.tasks.kibana.RestartKibanaServiceTask;
import co.hyperflex.upgrade.tasks.kibana.SetDefaultIndexTask;
import co.hyperflex.upgrade.tasks.kibana.UpdateKibanaPluginTask;
import co.hyperflex.upgrade.tasks.kibana.UpdateKibanaTask;
import co.hyperflex.upgrade.tasks.kibana.WaitForKibanaPortTask;
import co.hyperflex.upgrade.tasks.kibana.WaitForKibanaReadyTask;
import java.util.LinkedList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class KibanaUpgradePlanBuilder implements NodeUpgradePlanBuilder {

  private final RepositoryPreparationStep repoStep;
  private final UpdateKibanaTask update;
  private final RestartKibanaServiceTask restart;
  private final UpdateKibanaPluginTask updatePlugins;
  private final WaitForKibanaPortTask waitPort;
  private final WaitForKibanaReadyTask waitReady;
  private final SetDefaultIndexTask setDefault;

  public KibanaUpgradePlanBuilder(
      RepositoryPreparationStep repoStep,
      UpdateKibanaTask update,
      RestartKibanaServiceTask restart,
      UpdateKibanaPluginTask updatePlugins,
      WaitForKibanaPortTask waitPort,
      WaitForKibanaReadyTask waitReady,
      SetDefaultIndexTask setDefault) {
    this.repoStep = repoStep;
    this.update = update;
    this.restart = restart;
    this.updatePlugins = updatePlugins;
    this.waitPort = waitPort;
    this.waitReady = waitReady;
    this.setDefault = setDefault;
  }

  @Override
  public boolean supports(ClusterNodeEntity node) {
    return node.getType() == ClusterNodeType.KIBANA;
  }

  @Override
  public List<Task> buildPlan(ClusterNodeEntity node, ClusterUpgradeJobEntity job) {
    List<Task> tasks = new LinkedList<>(repoStep.prepare(node, job));
    tasks.add(update);
    tasks.add(updatePlugins);
    tasks.add(restart);
    tasks.add(waitPort);
    tasks.add(waitReady);
    tasks.add(setDefault);
    return tasks;
  }
}

package co.hyperflex.upgrade.planner.elastic;

import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.models.enums.NodeRoles;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.upgrade.planner.NodeUpgradePlanBuilder;
import co.hyperflex.upgrade.planner.common.RepositoryPreparationStep;
import co.hyperflex.upgrade.tasks.Task;
import co.hyperflex.upgrade.tasks.elastic.DisableShardAllocationTask;
import co.hyperflex.upgrade.tasks.elastic.EnableShardAllocationTask;
import co.hyperflex.upgrade.tasks.elastic.RestartElasticsearchServiceTask;
import co.hyperflex.upgrade.tasks.elastic.StartElasticsearchServiceTask;
import co.hyperflex.upgrade.tasks.elastic.StopElasticsearchServiceTask;
import co.hyperflex.upgrade.tasks.elastic.SyncedFlushTask;
import co.hyperflex.upgrade.tasks.elastic.UpdateElasticPluginTask;
import co.hyperflex.upgrade.tasks.elastic.UpdateElasticsearchTask;
import co.hyperflex.upgrade.tasks.elastic.WaitForElasticsearchHttpPortTask;
import co.hyperflex.upgrade.tasks.elastic.WaitForElasticsearchTransportPortTask;
import co.hyperflex.upgrade.tasks.elastic.WaitForGreenClusterStatusTask;
import co.hyperflex.upgrade.tasks.elastic.WaitForYellowOrGreenClusterStatusTask;
import co.hyperflex.upgrade.tasks.elastic.ml.DisableUpgradeModeTask;
import co.hyperflex.upgrade.tasks.elastic.ml.EnableUpgradeModeTask;
import java.util.LinkedList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ElasticUpgradePlanBuilder implements NodeUpgradePlanBuilder {

  private final RepositoryPreparationStep repoStep;
  private final StartElasticsearchServiceTask start;
  private final WaitForElasticsearchTransportPortTask waitTransport;
  private final WaitForGreenClusterStatusTask waitGreen;
  private final DisableShardAllocationTask disableShardAllocation;
  private final SyncedFlushTask flush;
  private final EnableUpgradeModeTask enableMlUpgrade;
  private final StopElasticsearchServiceTask stop;
  private final UpdateElasticsearchTask updateEs;
  private final UpdateElasticPluginTask updatePlugins;
  private final RestartElasticsearchServiceTask restart;
  private final WaitForElasticsearchHttpPortTask waitHttp;
  private final WaitForYellowOrGreenClusterStatusTask waitYellowOrGreen;
  private final EnableShardAllocationTask enableShardAllocation;
  private final DisableUpgradeModeTask disableMlUpgrade;

  public ElasticUpgradePlanBuilder(
      RepositoryPreparationStep repoStep,
      StartElasticsearchServiceTask start,
      WaitForElasticsearchTransportPortTask waitTransport,
      WaitForGreenClusterStatusTask waitGreen,
      DisableShardAllocationTask disableShardAllocation,
      SyncedFlushTask flush,
      EnableUpgradeModeTask enableMlUpgrade,
      StopElasticsearchServiceTask stop,
      UpdateElasticsearchTask updateEs,
      UpdateElasticPluginTask updatePlugins,
      RestartElasticsearchServiceTask restart,
      WaitForElasticsearchHttpPortTask waitHttp,
      WaitForYellowOrGreenClusterStatusTask waitYellowOrGreen,
      EnableShardAllocationTask enableShardAllocation,
      DisableUpgradeModeTask disableMlUpgrade) {
    this.repoStep = repoStep;
    this.start = start;
    this.waitTransport = waitTransport;
    this.waitGreen = waitGreen;
    this.disableShardAllocation = disableShardAllocation;
    this.flush = flush;
    this.enableMlUpgrade = enableMlUpgrade;
    this.stop = stop;
    this.updateEs = updateEs;
    this.updatePlugins = updatePlugins;
    this.restart = restart;
    this.waitHttp = waitHttp;
    this.waitYellowOrGreen = waitYellowOrGreen;
    this.enableShardAllocation = enableShardAllocation;
    this.disableMlUpgrade = disableMlUpgrade;
  }

  @Override
  public boolean supports(ClusterNodeEntity node) {
    return node.getType() == ClusterNodeType.ELASTIC;
  }

  @Override
  public List<Task> buildPlan(ClusterNodeEntity node, ClusterUpgradeJobEntity job) {
    List<Task> tasks = new LinkedList<>(repoStep.prepare(node, job));

    tasks.add(start);
    tasks.add(waitTransport);
    tasks.add(waitGreen);
    tasks.add(disableShardAllocation);
    tasks.add(flush);
    if (node.getRoles().contains(NodeRoles.ML)) {
      tasks.add(enableMlUpgrade);
    }
    tasks.add(stop);
    tasks.add(updateEs);
    tasks.add(updatePlugins);
    tasks.add(restart);
    tasks.add(waitTransport);
    tasks.add(waitHttp);
    tasks.add(waitYellowOrGreen);
    tasks.add(enableShardAllocation);
    tasks.add(waitGreen);
    if (node.getRoles().contains(NodeRoles.ML)) {
      tasks.add(disableMlUpgrade);
    }
    return tasks;
  }
}

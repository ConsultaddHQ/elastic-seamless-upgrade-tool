package co.hyperflex.upgrade.planner;

import co.hyperflex.common.utils.VersionUtils;
import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.upgrade.tasks.AddRepositoryTask;
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
import co.hyperflex.upgrade.tasks.kibana.RestartKibanaServiceTask;
import co.hyperflex.upgrade.tasks.kibana.SetDefaultIndexTask;
import co.hyperflex.upgrade.tasks.kibana.UpdateKibanaPluginTask;
import co.hyperflex.upgrade.tasks.kibana.UpdateKibanaTask;
import co.hyperflex.upgrade.tasks.kibana.WaitForKibanaPortTask;
import co.hyperflex.upgrade.tasks.kibana.WaitForKibanaReadyTask;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

@Component
public class UpgradePlanBuilder implements ApplicationContextAware {
  private ApplicationContext applicationContext;

  public List<Task> buildPlanFor(ClusterNodeEntity node, ClusterUpgradeJobEntity upgradeJob) {
    List<Task> tasks = new ArrayList<>();

    if (VersionUtils.isMajorVersionUpgrade(upgradeJob.getCurrentVersion(), upgradeJob.getTargetVersion())) {
      tasks.add(applicationContext.getBean(AddRepositoryTask.class));
    }
    if (node.getType() == ClusterNodeType.ELASTIC) {
      tasks.add(applicationContext.getBean(StartElasticsearchServiceTask.class));
      tasks.add(applicationContext.getBean(WaitForElasticsearchTransportPortTask.class));
      tasks.add(applicationContext.getBean(WaitForGreenClusterStatusTask.class));
      tasks.add(applicationContext.getBean(DisableShardAllocationTask.class));
      tasks.add(applicationContext.getBean(SyncedFlushTask.class));
      if (node.getRoles().contains("ml")) {
        tasks.add(applicationContext.getBean(EnableUpgradeModeTask.class));
      }
      tasks.add(applicationContext.getBean(StopElasticsearchServiceTask.class));
      tasks.add(applicationContext.getBean(UpdateElasticsearchTask.class));
      tasks.add(applicationContext.getBean(UpdateElasticPluginTask.class));
      tasks.add(applicationContext.getBean(RestartElasticsearchServiceTask.class));
      tasks.add(applicationContext.getBean(WaitForElasticsearchTransportPortTask.class));
      tasks.add(applicationContext.getBean(WaitForElasticsearchHttpPortTask.class));
      tasks.add(applicationContext.getBean(WaitForYellowOrGreenClusterStatusTask.class));
      tasks.add(applicationContext.getBean(EnableShardAllocationTask.class));
      tasks.add(applicationContext.getBean(WaitForGreenClusterStatusTask.class));
      if (node.getRoles().contains("ml")) {
        tasks.add(applicationContext.getBean(DisableUpgradeModeTask.class));
      }
    } else if (node.getType() == ClusterNodeType.KIBANA) {
      tasks.add(applicationContext.getBean(UpdateKibanaTask.class));
      tasks.add(applicationContext.getBean(RestartKibanaServiceTask.class));
      tasks.add(applicationContext.getBean(UpdateKibanaPluginTask.class));
      tasks.add(applicationContext.getBean(WaitForKibanaPortTask.class));
      tasks.add(applicationContext.getBean(WaitForKibanaReadyTask.class));
      tasks.add(applicationContext.getBean(SetDefaultIndexTask.class));
    } else {
      throw new UnsupportedOperationException("Unsupported ClusterNodeType: " + node.getType());
    }

    return tasks;
  }

  @Override
  public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
    this.applicationContext = applicationContext;
  }
}

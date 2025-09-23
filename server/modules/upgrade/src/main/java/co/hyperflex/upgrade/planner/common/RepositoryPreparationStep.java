package co.hyperflex.upgrade.planner.common;

import co.hyperflex.common.utils.VersionUtils;
import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.core.models.enums.PackageManager;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.upgrade.tasks.Task;
import co.hyperflex.upgrade.tasks.common.repository.AddRepositoryTask;
import co.hyperflex.upgrade.tasks.common.repository.InstallAptTransportHttpsTask;
import co.hyperflex.upgrade.tasks.common.repository.UpdateAptCacheTask;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class RepositoryPreparationStep {

  private final InstallAptTransportHttpsTask aptTransportTask;
  private final AddRepositoryTask addRepoTask;
  private final UpdateAptCacheTask updateAptCacheTask;

  public RepositoryPreparationStep(
      InstallAptTransportHttpsTask aptTransportTask,
      AddRepositoryTask addRepoTask,
      UpdateAptCacheTask updateAptCacheTask) {
    this.aptTransportTask = aptTransportTask;
    this.addRepoTask = addRepoTask;
    this.updateAptCacheTask = updateAptCacheTask;
  }

  public List<Task> prepare(ClusterNodeEntity node, ClusterUpgradeJobEntity job) {
    List<Task> tasks = new ArrayList<>();
    var pkg = node.getOs().packageManager();
    if (VersionUtils.isMajorVersionUpgrade(job.getCurrentVersion(), job.getTargetVersion())) {

      // We need to add this if we are migrating from v7->v8
      if (pkg == PackageManager.APT && job.getCurrentVersion().startsWith("7")) {
        tasks.add(aptTransportTask);
      }
      tasks.add(addRepoTask);
      if (pkg == PackageManager.APT) {
        tasks.add(updateAptCacheTask);
      }
    }
    return tasks;
  }
}

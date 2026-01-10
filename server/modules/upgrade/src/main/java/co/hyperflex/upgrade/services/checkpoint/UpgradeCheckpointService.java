package co.hyperflex.upgrade.services.checkpoint;

import co.hyperflex.core.repositories.ClusterUpgradeJobRepository;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
public class UpgradeCheckpointService {
  private final ClusterUpgradeJobRepository clusterUpgradeJobRepository;
  private final ClusterUpgradeJobService clusterUpgradeJobService;

  public UpgradeCheckpointService(ClusterUpgradeJobRepository clusterUpgradeJobRepository,
                                  ClusterUpgradeJobService clusterUpgradeJobService) {
    this.clusterUpgradeJobRepository = clusterUpgradeJobRepository;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
  }

  public void setCheckPoint(final String jobId, final String nodeId, final int checkPoint) {
    Update update = new Update().set("nodeCheckPoints." + nodeId, checkPoint);
    clusterUpgradeJobRepository.updateById(jobId, update);
  }

  public int getCheckPoint(final String jobId, final String nodeId) {
    return clusterUpgradeJobService.getUpgradeJobById(jobId).getNodeCheckPoints().getOrDefault(nodeId, 0);
  }
}

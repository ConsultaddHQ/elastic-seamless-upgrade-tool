package co.hyperflex.core.services.upgrade;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.elastic.dto.info.InfoResponse;
import co.hyperflex.common.exceptions.ConflictException;
import co.hyperflex.common.exceptions.NotFoundException;
import co.hyperflex.core.models.enums.ClusterUpgradeStatus;
import co.hyperflex.core.repositories.ClusterUpgradeJobRepository;
import co.hyperflex.core.services.clusters.ClusterService;
import co.hyperflex.core.services.notifications.NotificationService;
import co.hyperflex.core.services.notifications.UpgradeJobCreatedEvent;
import co.hyperflex.core.services.notifications.UpgradeProgressChangeEvent;
import co.hyperflex.core.services.upgrade.dtos.CreateClusterUpgradeJobRequest;
import co.hyperflex.core.services.upgrade.dtos.CreateClusterUpgradeJobResponse;
import co.hyperflex.core.services.upgrade.dtos.GetTargetVersionResponse;
import co.hyperflex.core.services.upgrade.dtos.GetUpgradeJobStatusResponse;
import co.hyperflex.core.services.upgrade.dtos.StopClusterUpgradeResponse;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.core.utils.UpgradePathUtils;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
public class ClusterUpgradeJobService {
  private static final Logger logger = LoggerFactory.getLogger(ClusterUpgradeJobService.class);
  private final ClusterUpgradeJobRepository clusterUpgradeJobRepository;
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final ClusterService clusterService;
  private final NotificationService notificationService;

  public ClusterUpgradeJobService(ClusterUpgradeJobRepository clusterUpgradeJobRepository,
                                  ElasticsearchClientProvider elasticsearchClientProvider,
                                  ClusterService clusterService, NotificationService notificationService) {
    this.clusterUpgradeJobRepository = clusterUpgradeJobRepository;
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.clusterService = clusterService;
    this.notificationService = notificationService;
  }

  public @NotNull ClusterUpgradeJobEntity getActiveJobByClusterId(@NotNull String clusterId) {
    return clusterUpgradeJobRepository
        .findByClusterId(clusterId)
        .stream()
        .filter(ClusterUpgradeJobEntity::isActive)
        .filter(clusterUpgradeJob -> !ClusterUpgradeStatus.UPDATED.equals(clusterUpgradeJob.getStatus()))
        .findFirst().orElseThrow(
            () -> new NotFoundException("Active upgrade job not found for this cluster."));
  }

  public @NotNull ClusterUpgradeJobEntity getLatestJobByClusterId(@NotNull String clusterId) {
    return clusterUpgradeJobRepository
        .findByClusterId(clusterId)
        .stream()
        .filter(ClusterUpgradeJobEntity::isActive)
        .findFirst()
        .orElseThrow(() -> new NotFoundException("Upgrade job not found for this cluster."));
  }

  public CreateClusterUpgradeJobResponse createClusterUpgradeJob(
      @NotNull String clusterId, @NotNull CreateClusterUpgradeJobRequest request) {

    List<ClusterUpgradeJobEntity> jobs = clusterUpgradeJobRepository.findByClusterId(clusterId);

    ElasticClient elasticClient =
        elasticsearchClientProvider.getClient(clusterId);
    InfoResponse info = elasticClient.getInfo();
    String currentVersion = info.getVersion().getNumber();

    ClusterUpgradeJobEntity existingJob = jobs.stream().filter(
        job -> job.getCurrentVersion().equals(currentVersion)
            && job.getTargetVersion().equals(request.targetVersion())
    ).findFirst().orElse(null);

    jobs.forEach(job -> {
      var jobStatus = job.getStatus();
      var isPending = ClusterUpgradeStatus.PENDING.equals(jobStatus);
      var isUpdated = ClusterUpgradeStatus.UPDATED.equals(jobStatus);
      if (!(isUpdated || isPending)) {
        logger.error("Cluster is under upgrade can't create upgrade job for [cluster: {}].", clusterId);
        throw new ConflictException("Cluster is under upgrade can't create upgrade job for cluster");
      }
      job.setActive(false);
    });

    if (existingJob == null) {
      existingJob = new ClusterUpgradeJobEntity();
      existingJob.setClusterId(clusterId);
      existingJob.setTargetVersion(request.targetVersion());
      existingJob.setCurrentVersion(currentVersion);
      existingJob.setActive(true);
      clusterUpgradeJobRepository.save(existingJob);
    } else {
      existingJob.setActive(true);
    }

    clusterUpgradeJobRepository.saveAll(jobs);

    // Update node status back to available
    clusterService.resetUpgradeStatus(clusterId);

    notificationService.sendNotification(new UpgradeJobCreatedEvent(existingJob.getId(), clusterId));

    return new CreateClusterUpgradeJobResponse("Cluster upgrade job created successfully", existingJob.getId());
  }

  public StopClusterUpgradeResponse stopClusterUpgrade(@NotNull String clusterId) {
    final ClusterUpgradeJobEntity job = getActiveJobByClusterId(clusterId);
    Update update = new Update().set(ClusterUpgradeJobEntity.STOP, true);
    clusterUpgradeJobRepository.updateById(job.getId(), update);
    notificationService.sendNotification(new UpgradeProgressChangeEvent());
    return new StopClusterUpgradeResponse();
  }

  public void setJobStatus(String id, ClusterUpgradeStatus status) {
    Update update = new Update().set(ClusterUpgradeJobEntity.STATUS, status);
    update.set(ClusterUpgradeJobEntity.STOP, false);
    clusterUpgradeJobRepository.updateById(id, update);
  }

  public ClusterUpgradeJobEntity getUpgradeJobById(@NotNull String clusterUpgradeJobId) {
    return clusterUpgradeJobRepository.findById(clusterUpgradeJobId).orElseThrow();
  }

  public void setCheckPoint(final String jobId, final String nodeId, final int checkPoint) {
    Update update = new Update().set("nodeCheckPoints." + nodeId, checkPoint);
    clusterUpgradeJobRepository.updateById(jobId, update);
  }

  public int getCheckPoint(final String jobId, final String nodeId) {
    return getUpgradeJobById(jobId).getNodeCheckPoints().getOrDefault(nodeId, 0);
  }

  public GetTargetVersionResponse getTargetVersionInfo(String clusterId) {
    String targetVersion = null;
    boolean underUpgrade = false;
    try {
      ClusterUpgradeJobEntity job = getActiveJobByClusterId(clusterId);
      targetVersion = job.getTargetVersion();
      underUpgrade = job.getStatus() != ClusterUpgradeStatus.PENDING;
    } catch (Exception e) {
      logger.debug("Cluster upgrade job not found for [cluster: {}].", clusterId);
    }
    List<String> possibleUpgrades;
    if (underUpgrade) {
      possibleUpgrades = List.of();
    } else {
      ElasticClient elasticClient = elasticsearchClientProvider.getClient(clusterId);
      var info = elasticClient.getInfo();
      possibleUpgrades = UpgradePathUtils.getPossibleUpgrades(info.getVersion().getNumber());
    }
    return new GetTargetVersionResponse(targetVersion, underUpgrade, possibleUpgrades);
  }

  public GetUpgradeJobStatusResponse getUpgradeJobStatus(String clusterId) {
    final ClusterUpgradeJobEntity upgradeJob = getLatestJobByClusterId(clusterId);
    return new GetUpgradeJobStatusResponse(
        upgradeJob.isStop(),
        upgradeJob.getStatus()
    );
  }
}

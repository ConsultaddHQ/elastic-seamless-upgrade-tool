package co.hyperflex.services;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.InfoResponse;
import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.dtos.upgrades.CreateClusterUpgradeJobRequest;
import co.hyperflex.dtos.upgrades.CreateClusterUpgradeJobResponse;
import co.hyperflex.dtos.upgrades.GetTargetVersionResponse;
import co.hyperflex.dtos.upgrades.GetUpgradeJobStatusResponse;
import co.hyperflex.dtos.upgrades.StopClusterUpgradeResponse;
import co.hyperflex.entities.upgrade.ClusterUpgradeJob;
import co.hyperflex.entities.upgrade.ClusterUpgradeStatus;
import co.hyperflex.exceptions.ConflictException;
import co.hyperflex.exceptions.NotFoundException;
import co.hyperflex.repositories.ClusterUpgradeJobRepository;
import co.hyperflex.services.notifications.NotificationService;
import co.hyperflex.services.notifications.UpgradeProgressChangeEvent;
import co.hyperflex.utils.UpgradePathUtils;
import jakarta.validation.constraints.NotNull;
import java.io.IOException;
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

  public @NotNull ClusterUpgradeJob getActiveJobByClusterId(@NotNull String clusterId) {
    return clusterUpgradeJobRepository
        .findByClusterId(clusterId)
        .stream()
        .filter(ClusterUpgradeJob::isActive)
        .filter(clusterUpgradeJob -> !ClusterUpgradeStatus.UPDATED.equals(clusterUpgradeJob.getStatus()))
        .findFirst().orElseThrow(
            () -> new NotFoundException("Active upgrade job not found for this cluster."));
  }

  public @NotNull ClusterUpgradeJob getLatestJobByClusterId(@NotNull String clusterId) {
    return clusterUpgradeJobRepository
        .findByClusterId(clusterId)
        .stream()
        .filter(ClusterUpgradeJob::isActive)
        .findFirst()
        .orElseThrow(() -> new NotFoundException("Upgrade job not found for this cluster."));
  }

  public CreateClusterUpgradeJobResponse createClusterUpgradeJob(
      @NotNull String clusterId, @NotNull CreateClusterUpgradeJobRequest request) {

    List<ClusterUpgradeJob> jobs = clusterUpgradeJobRepository.findByClusterId(clusterId);

    ElasticClient elasticClient =
        elasticsearchClientProvider.getClientByClusterId(clusterId);
    InfoResponse info = elasticClient.getClusterInfo();
    String currentVersion = info.version().number();

    ClusterUpgradeJob existingJob = jobs.stream().filter(
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
      existingJob = new ClusterUpgradeJob();
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

    return new CreateClusterUpgradeJobResponse("Cluster upgrade job created successfully", existingJob.getId());
  }

  public StopClusterUpgradeResponse stopClusterUpgrade(@NotNull String clusterId) {
    final ClusterUpgradeJob job = getActiveJobByClusterId(clusterId);
    Update update = new Update().set(ClusterUpgradeJob.STOP, true);
    clusterUpgradeJobRepository.updateById(job.getId(), update);
    notificationService.sendNotification(new UpgradeProgressChangeEvent());
    return new StopClusterUpgradeResponse();
  }

  public void setJobStatus(String id, ClusterUpgradeStatus status) {
    Update update = new Update().set(ClusterUpgradeJob.STATUS, status);
    update.set(ClusterUpgradeJob.STOP, false);
    clusterUpgradeJobRepository.updateById(id, update);
  }

  public ClusterUpgradeJob getUpgradeJobById(@NotNull String clusterUpgradeJobId) {
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
    try {
      String targetVersion = null;
      boolean underUpgrade = false;
      try {
        ClusterUpgradeJob job = getActiveJobByClusterId(clusterId);
        targetVersion = job.getTargetVersion();
        underUpgrade = job.getStatus() != ClusterUpgradeStatus.PENDING;
      } catch (Exception e) {
        logger.debug("Cluster upgrade job not found for [cluster: {}].", clusterId);
      }
      List<String> possibleUpgrades;
      if (underUpgrade) {
        possibleUpgrades = List.of();
      } else {
        ElasticClient elasticClient = elasticsearchClientProvider.getClientByClusterId(clusterId);
        ElasticsearchClient client = elasticClient.getElasticsearchClient();
        var info = client.info();
        possibleUpgrades = UpgradePathUtils.getPossibleUpgrades(info.version().number());
      }
      return new GetTargetVersionResponse(targetVersion, underUpgrade, possibleUpgrades);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public GetUpgradeJobStatusResponse getUpgradeJobStatus(String clusterId) {
    final ClusterUpgradeJob upgradeJob = getLatestJobByClusterId(clusterId);
    return new GetUpgradeJobStatusResponse(
        upgradeJob.isStop(),
        upgradeJob.getStatus()
    );
  }
}

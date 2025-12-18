package co.hyperflex.upgrade.services;

import co.hyperflex.breakingchanges.services.deprecations.DeprecationService;
import co.hyperflex.breakingchanges.services.deprecations.dtos.DeprecationCounts;
import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.elastic.dto.GetElasticsearchSnapshotResponse;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.clients.kibana.KibanaClientProvider;
import co.hyperflex.core.entites.clusters.ClusterEntity;
import co.hyperflex.core.entites.clusters.SelfManagedClusterEntity;
import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.core.exceptions.BadRequestException;
import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.models.enums.ClusterUpgradeStatus;
import co.hyperflex.core.models.enums.NodeUpgradeStatus;
import co.hyperflex.core.repositories.ClusterNodeRepository;
import co.hyperflex.core.repositories.ClusterRepository;
import co.hyperflex.core.services.clusters.ClusterService;
import co.hyperflex.core.services.clusters.dtos.GetClusterNodeResponse;
import co.hyperflex.core.services.clusters.dtos.GetClusterResponse;
import co.hyperflex.core.services.clusters.dtos.GetElasticCloudClusterResponse;
import co.hyperflex.core.services.clusters.lock.ClusterLockService;
import co.hyperflex.core.services.notifications.NotificationService;
import co.hyperflex.core.services.notifications.UpgradeProgressChangeEvent;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.services.upgrade.dtos.ClusterNodeUpgradeRequest;
import co.hyperflex.core.services.upgrade.dtos.ClusterNodeUpgradeResponse;
import co.hyperflex.core.services.upgrade.dtos.ClusterUpgradeResponse;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.core.utils.VersionUtils;
import co.hyperflex.precheck.core.enums.PrecheckStatus;
import co.hyperflex.precheck.services.PrecheckRunService;
import co.hyperflex.upgrade.entities.UpgradeLogEntity;
import co.hyperflex.upgrade.planner.UpgradePlanBuilder;
import co.hyperflex.upgrade.services.dtos.ClusterInfoResponse;
import co.hyperflex.upgrade.services.dtos.NodeUpgradePlanResponse;
import co.hyperflex.upgrade.tasks.Configuration;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.Task;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.util.Comparator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;

@Service
public class ClusterUpgradeService {
  private static final Logger log = LoggerFactory.getLogger(ClusterUpgradeService.class);
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final ClusterNodeRepository clusterNodeRepository;
  private final ClusterService clusterService;
  private final ClusterRepository clusterRepository;
  private final KibanaClientProvider kibanaClientProvider;
  private final ClusterUpgradeJobService clusterUpgradeJobService;
  private final NotificationService notificationService;
  private final DeprecationService deprecationService;
  private final ExecutorService executorService = Executors.newFixedThreadPool(1);
  private final PrecheckRunService precheckRunService;
  private final ClusterLockService clusterLockService;
  private final UpgradePlanBuilder upgradePlanBuilder;
  private final UpgradeNotificationService upgradeNotificationService;

  public ClusterUpgradeService(ElasticsearchClientProvider elasticsearchClientProvider,
                               ClusterNodeRepository clusterNodeRepository,
                               ClusterService clusterService, ClusterRepository clusterRepository,
                               KibanaClientProvider kibanaClientProvider,
                               ClusterUpgradeJobService clusterUpgradeJobService,
                               NotificationService notificationService,
                               DeprecationService deprecationService,
                               PrecheckRunService precheckRunService,
                               ClusterLockService clusterLockService,
                               UpgradePlanBuilder upgradePlanBuilder,
                               UpgradeNotificationService upgradeNotificationService) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.clusterNodeRepository = clusterNodeRepository;
    this.clusterService = clusterService;
    this.clusterRepository = clusterRepository;
    this.kibanaClientProvider = kibanaClientProvider;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
    this.notificationService = notificationService;
    this.deprecationService = deprecationService;
    this.precheckRunService = precheckRunService;
    this.clusterLockService = clusterLockService;
    this.upgradePlanBuilder = upgradePlanBuilder;
    this.upgradeNotificationService = upgradeNotificationService;
  }

  public ClusterNodeUpgradeResponse upgradeNode(ClusterNodeUpgradeRequest request, Map<String, Boolean> flags) {

    ClusterEntity cluster = clusterRepository.findById(request.clusterId()).orElseThrow();
    if (cluster instanceof SelfManagedClusterEntity selfManagedCluster) {
      ClusterUpgradeJobEntity clusterUpgradeJob = clusterUpgradeJobService.getActiveJobByClusterId(request.clusterId());
      ClusterNodeEntity clusterNode = clusterNodeRepository.findById(request.nodeId()).orElseThrow();
      upgradeNodes(selfManagedCluster, List.of(clusterNode), clusterUpgradeJob.getId(), flags);
    } else {
      throw new BadRequestException("Upgrade not supported for cluster");
    }
    return new ClusterNodeUpgradeResponse("Node upgrade started");
  }

  public ClusterUpgradeResponse upgrade(String clusterId, ClusterNodeType nodeType) {
    ClusterEntity cluster = clusterRepository.findById(clusterId).orElseThrow();
    if (cluster instanceof SelfManagedClusterEntity selfManagedCluster) {
      ClusterUpgradeJobEntity clusterUpgradeJob = clusterUpgradeJobService.getActiveJobByClusterId(clusterId);
      List<ClusterNodeEntity> clusterNodes =
          clusterNodeRepository.findByClusterId(clusterId).stream().filter(node -> node.getType() == nodeType)
              .sorted(Comparator.comparingInt(ClusterNodeEntity::getRank)).toList();

      upgradeNodes(selfManagedCluster, clusterNodes, clusterUpgradeJob.getId(), Map.of());
    } else {
      throw new BadRequestException("Upgrade not supported for cluster");
    }
    return new ClusterUpgradeResponse("Cluster upgrade started");
  }

  public ClusterInfoResponse upgradeInfo(String clusterId) {
    ClusterUpgradeJobEntity upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    try {
      ElasticClient client = elasticsearchClientProvider.getClient(clusterId);
      KibanaClient kibanaClient = kibanaClientProvider.getClient(clusterId);
      GetClusterResponse cluster = clusterService.getClusterById(clusterId);
      PrecheckStatus precheckStatus = null;
      if (upgradeJob != null) {
        boolean isClusterUpgrading = upgradeJob.getStatus() == ClusterUpgradeStatus.UPGRADING
            || upgradeJob.getStatus() == ClusterUpgradeStatus.PARTIALLY_UPDATED
            || upgradeJob.getStatus() == ClusterUpgradeStatus.FAILED;
        if (isClusterUpgrading) {
          precheckStatus = PrecheckStatus.COMPLETED;
        } else {
          precheckStatus = precheckRunService.getStatusByUpgradeJobId(upgradeJob.getId());
        }
      } else {
        precheckStatus = PrecheckStatus.COMPLETED;
      }

      List<GetElasticsearchSnapshotResponse> snapshots = client.getValidSnapshots(upgradeJob.getCurrentVersion());

      DeprecationCounts kibanaDeprecationCounts = deprecationService.getKibanaDeprecationCounts(clusterId);
      DeprecationCounts elasticDeprecationCounts = deprecationService.getElasticDeprecationCounts(clusterId);

      boolean isClusterUpgraded = upgradeJob.getStatus() == ClusterUpgradeStatus.UPDATED;
      // Evaluate upgrade status
      boolean isESUpgraded = isClusterUpgraded || clusterService.isNodesUpgraded(clusterId, ClusterNodeType.ELASTIC);
      boolean isKibanaUpgraded = isClusterUpgraded || clusterService.isNodesUpgraded(clusterId, ClusterNodeType.KIBANA);
      boolean isValidUpgradePath = VersionUtils.isValidUpgrade(upgradeJob.getCurrentVersion(), upgradeJob.getTargetVersion());
      boolean isElasticUpgradable = !isESUpgraded;
      boolean isKibanaUpgradable = !isKibanaUpgraded && isESUpgraded;

      ClusterInfoResponse.Elastic elastic = new ClusterInfoResponse.Elastic(isElasticUpgradable, elasticDeprecationCounts,
          new ClusterInfoResponse.Elastic.SnapshotWrapper(snapshots.isEmpty() ? null : snapshots.getFirst(),
              kibanaClient.getSnapshotCreationPageUrl()));

      ClusterInfoResponse.Kibana kibana = new ClusterInfoResponse.Kibana(isKibanaUpgradable, kibanaDeprecationCounts);

      ClusterInfoResponse.Precheck precheck = new ClusterInfoResponse.Precheck(precheckStatus);
      String deploymentId = cluster instanceof GetElasticCloudClusterResponse elasticCloud ? elasticCloud.getDeploymentId() : null;
      return new ClusterInfoResponse(elastic, kibana, precheck, deploymentId, isValidUpgradePath);
    } catch (Exception e) {
      log.error("Failed to get upgrade info for clusterId: {}", clusterId, e);
      throw new RuntimeException(e);
    }
  }

  private void upgradeNodes(SelfManagedClusterEntity cluster, List<ClusterNodeEntity> nodes, String clusterUpgradeJobId,
                            Map<String, Boolean> flags) {
    validateUpgradePath(clusterUpgradeJobId);
    executorService.submit(() -> {
      try {
        final Logger log = LoggerFactory.getLogger(UpgradeLogService.class);
        clusterLockService.lock(cluster.getId());

        clusterUpgradeJobService.setJobStatus(clusterUpgradeJobId, ClusterUpgradeStatus.UPGRADING);
        MDC.put(UpgradeLogEntity.CLUSTER_UPGRADE_JOB_ID, clusterUpgradeJobId);

        ElasticClient elasticClient = elasticsearchClientProvider.getClient(cluster.getId());
        KibanaClient kibanaClient = kibanaClientProvider.getClient(cluster.getId());

        final String targetVersion = clusterUpgradeJobService.getUpgradeJobById(clusterUpgradeJobId).getTargetVersion();

        for (ClusterNodeEntity node : nodes.stream().sorted(Comparator.comparingInt(ClusterNodeEntity::getRank)).toList()) {

          if (clusterUpgradeJobService.getUpgradeJobById(clusterUpgradeJobId).isStop()) {
            clusterUpgradeJobService.setJobStatus(clusterUpgradeJobId, ClusterUpgradeStatus.STOPPED);
            upgradeNotificationService.notifyClusterUpgradeStopped(cluster);
            break;
          }

          MDC.put(UpgradeLogEntity.NODE_ID, node.getId());
          if (NodeUpgradeStatus.UPGRADED == node.getStatus()) {
            log.info("Skipping node with [NodeId: {}] as its already updated", node.getId());
            continue;
          } else if (VersionUtils.isVersionGte(node.getVersion(), targetVersion)) {
            log.info("Skipping node with [NodeId: {}] as its already on target version", node.getId());
            node.setStatus(NodeUpgradeStatus.UPGRADED);
            updateNodeProgress(node, 100);
            continue;
          }

          Configuration config =
              new Configuration(9300, 9200, cluster.getSshInfo(), targetVersion);
          Context context = new Context(node, config, log, elasticClient, kibanaClient);

          List<Task> tasks = upgradePlanBuilder.buildPlanFor(node, clusterUpgradeJobService.getUpgradeJobById(clusterUpgradeJobId));

          int checkPoint = clusterUpgradeJobService.getCheckPoint(clusterUpgradeJobId, node.getId());

          node.setStatus(NodeUpgradeStatus.UPGRADING);
          updateNodeProgress(node, 0);

          int index = 0;
          for (Task task : tasks) {
            if (index++ < checkPoint) {
              log.info("Skipping task [name: {}] for node [id: {}] — already upgraded.", task.getName(), node.getId());
              continue;
            }
            try {
              if (task.skip(flags)) {
                log.error("Task [name: {}] skipped by user for node [ip: {}]", task.getName(), node.getIp());
              } else {
                log.info("Starting task [name: {}] for node [ip: {}]", task.getName(), node.getIp());
                TaskResult result = task.run(context);
                log.info("Task [name: {}] completed for node [ip: {}] [success: {}] [result: {}] [progress: {}%]", task.getName(),
                    node.getIp(),
                    result.success(), result.message(), (index * 100) / tasks.size());

                if (!result.success()) {
                  log.error("Task [name: {}] failed for node [ip: {}] — {}", task.getName(), node.getIp(), result.message());
                  throw new RuntimeException(result.message());
                }
              }

              checkPoint++;
              clusterUpgradeJobService.setCheckPoint(clusterUpgradeJobId, node.getId(), checkPoint);

              int progress = (int) ((checkPoint * 100.0) / tasks.size());
              updateNodeProgress(node, progress);

              Thread.sleep(2000);
            } catch (Exception e) {
              node.setStatus(NodeUpgradeStatus.FAILED);
              int progress = (int) ((checkPoint * 100.0) / tasks.size());
              updateNodeProgress(node, progress);
              upgradeNotificationService.notifyNodeUpgradeFailed(node);

              log.error("Exception while running task [name: {}] for node [ip: {}]: {}", task.getName(), node.getIp(), e.getMessage(), e);
              throw new RuntimeException(e.getMessage(), e);
            } finally {
              notificationService.sendNotification(new UpgradeProgressChangeEvent());
            }
          }

          node.setVersion(config.targetVersion());
          node.setStatus(NodeUpgradeStatus.UPGRADED);
          updateNodeProgress(node, 100);
          upgradeNotificationService.notifyNodeUpgradedSuccessfully(cluster, node);
        }

      } catch (Exception e) {
        clusterUpgradeJobService.setJobStatus(clusterUpgradeJobId, ClusterUpgradeStatus.FAILED);
        if (nodes.size() > 1) {
          upgradeNotificationService.notifyClusterUpgradeFailed(cluster);
        }
        log.error("[ClusterId: {}] Cluster upgrade failed", cluster.getId(), e);
      } finally {
        clusterService.syncClusterState(cluster.getId());
        syncUpgradeJobStatus(cluster, clusterUpgradeJobId);
        notificationService.sendNotification(new UpgradeProgressChangeEvent());
        MDC.clear();
        clusterLockService.unlock(cluster.getId());
      }
    });
  }

  private void syncUpgradeJobStatus(SelfManagedClusterEntity cluster, String clusterUpgradeJobId) {
    final ClusterUpgradeJobEntity clusterUpgradeJob = clusterUpgradeJobService.getUpgradeJobById(clusterUpgradeJobId);
    List<GetClusterNodeResponse> nodes = clusterService.getNodes(cluster.getId(), null).stream()
        .filter(node -> node.status() != NodeUpgradeStatus.UPGRADED && !clusterUpgradeJob.getTargetVersion().equals(node.version()))
        .toList();
    if (nodes.isEmpty()) {
      clusterUpgradeJobService.setJobStatus(clusterUpgradeJob.getId(), ClusterUpgradeStatus.UPDATED);
      upgradeNotificationService.notifyClusterUpgradedSuccessfully(cluster);
    } else if (!clusterUpgradeJob.getStatus().equals(ClusterUpgradeStatus.STOPPED)) {
      var failedNodeExists = nodes
          .stream()
          .anyMatch(node -> NodeUpgradeStatus.FAILED.equals(node.status()));
      clusterUpgradeJobService.setJobStatus(clusterUpgradeJob.getId(),
          failedNodeExists ? ClusterUpgradeStatus.FAILED : ClusterUpgradeStatus.PARTIALLY_UPDATED
      );
    }
  }

  private void updateNodeProgress(ClusterNodeEntity node, int progress) {
    node.setProgress(progress);
    clusterNodeRepository.save(node);
    notificationService.sendNotification(new UpgradeProgressChangeEvent());
  }

  public NodeUpgradePlanResponse clusterNodeUpgradePlan(String clusterId, String nodeId) {
    ClusterNodeEntity node = clusterNodeRepository.findById(nodeId).orElseThrow();
    ClusterUpgradeJobEntity upgradeJob = clusterUpgradeJobService.getActiveJobByClusterId(clusterId);
    List<Task> tasks = upgradePlanBuilder.buildPlanFor(node, upgradeJob);
    int index = 0;
    int checkpoint = upgradeJob.getNodeCheckPoints().getOrDefault(nodeId, 0);
    List<NodeUpgradePlanResponse.Task> planTasks = new LinkedList<>();
    for (Task task : tasks) {
      var status = NodeUpgradeStatus.AVAILABLE;
      if (checkpoint == index) {
        status = node.getStatus();
      } else if (checkpoint > index) {
        status = NodeUpgradeStatus.UPGRADED;
      }

      planTasks.add(
          new NodeUpgradePlanResponse.Task(
              task.getId() + "-" + index,
              task.getName(),
              status));

      index++;
    }
    return new NodeUpgradePlanResponse(planTasks);
  }

  private void validateUpgradePath(String upgradeJobId) {
    var job = clusterUpgradeJobService.getUpgradeJobById(upgradeJobId);
    if (!VersionUtils.isValidUpgrade(job.getCurrentVersion(), job.getTargetVersion())) {
      throw new BadRequestException("Direct upgrades across multiple major versions are not allowed."
          + " Please complete intermediate upgrades before proceeding.");
    }
  }
}

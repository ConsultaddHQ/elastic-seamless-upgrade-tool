package co.hyperflex.services;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.clients.kibana.KibanaClientProvider;
import co.hyperflex.dtos.ClusterInfoResponse;
import co.hyperflex.dtos.GetElasticsearchSnapshotResponse;
import co.hyperflex.dtos.clusters.GetClusterNodeResponse;
import co.hyperflex.dtos.clusters.GetClusterResponse;
import co.hyperflex.dtos.clusters.GetElasticCloudClusterResponse;
import co.hyperflex.dtos.prechecks.GetPrecheckGroupResponse;
import co.hyperflex.dtos.upgrades.ClusterNodeUpgradeRequest;
import co.hyperflex.dtos.upgrades.ClusterNodeUpgradeResponse;
import co.hyperflex.dtos.upgrades.ClusterUpgradeResponse;
import co.hyperflex.entities.cluster.Cluster;
import co.hyperflex.entities.cluster.ClusterNode;
import co.hyperflex.entities.cluster.ClusterNodeType;
import co.hyperflex.entities.cluster.SelfManagedCluster;
import co.hyperflex.entities.precheck.PrecheckStatus;
import co.hyperflex.entities.upgrade.ClusterUpgradeJob;
import co.hyperflex.entities.upgrade.ClusterUpgradeStatus;
import co.hyperflex.entities.upgrade.NodeUpgradeStatus;
import co.hyperflex.exceptions.BadRequestException;
import co.hyperflex.prechecks.scheduler.PrecheckSchedulerService;
import co.hyperflex.repositories.ClusterNodeRepository;
import co.hyperflex.repositories.ClusterRepository;
import co.hyperflex.repositories.ClusterUpgradeJobRepository;
import co.hyperflex.services.notifications.GeneralNotificationEvent;
import co.hyperflex.services.notifications.NotificationService;
import co.hyperflex.services.notifications.NotificationType;
import co.hyperflex.services.notifications.UpgradeProgressChangeEvent;
import co.hyperflex.upgrader.planner.UpgradePlanBuilder;
import co.hyperflex.upgrader.tasks.Configuration;
import co.hyperflex.upgrader.tasks.Context;
import co.hyperflex.upgrader.tasks.Task;
import co.hyperflex.upgrader.tasks.TaskResult;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
  private final PrecheckSchedulerService precheckSchedulerService;
  private final DeprecationService deprecationService;
  private final ExecutorService executorService = Executors.newFixedThreadPool(1);
  private final Lock lock = new ReentrantLock();
  private final PrecheckRunService precheckRunService;
  private final ClusterUpgradeJobRepository clusterUpgradeJobRepository;

  public ClusterUpgradeService(ElasticsearchClientProvider elasticsearchClientProvider, ClusterNodeRepository clusterNodeRepository,
                               ClusterService clusterService, ClusterRepository clusterRepository,
                               KibanaClientProvider kibanaClientProvider, ClusterUpgradeJobService clusterUpgradeJobService,
                               NotificationService notificationService,
                               PrecheckSchedulerService precheckSchedulerService, DeprecationService deprecationService,
                               PrecheckRunService precheckRunService, ClusterUpgradeJobRepository clusterUpgradeJobRepository) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.clusterNodeRepository = clusterNodeRepository;
    this.clusterService = clusterService;
    this.clusterRepository = clusterRepository;
    this.kibanaClientProvider = kibanaClientProvider;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
    this.notificationService = notificationService;
    this.precheckSchedulerService = precheckSchedulerService;
    this.deprecationService = deprecationService;
    this.precheckRunService = precheckRunService;
    this.clusterUpgradeJobRepository = clusterUpgradeJobRepository;
  }

  public ClusterNodeUpgradeResponse upgradeNode(ClusterNodeUpgradeRequest request) {

    Cluster cluster = clusterRepository.findById(request.clusterId()).orElseThrow();
    if (cluster instanceof SelfManagedCluster selfManagedCluster) {
      ClusterUpgradeJob clusterUpgradeJob = clusterUpgradeJobService.getActiveJobByClusterId(request.clusterId());
      ClusterNode clusterNode = clusterNodeRepository.findById(request.nodeId()).orElseThrow();
      upgradeNodes(selfManagedCluster, List.of(clusterNode), clusterUpgradeJob);
    } else {
      throw new BadRequestException("Upgrade not supported for cluster");
    }
    return new ClusterNodeUpgradeResponse("Node upgrade started");
  }

  public ClusterUpgradeResponse upgrade(String clusterId) {
    Cluster cluster = clusterRepository.findById(clusterId).orElseThrow();
    if (cluster instanceof SelfManagedCluster selfManagedCluster) {
      ClusterUpgradeJob clusterUpgradeJob = clusterUpgradeJobService.getActiveJobByClusterId(clusterId);
      List<ClusterNode> clusterNodes =
          clusterNodeRepository.findByClusterId(clusterId).stream().filter(node -> node.getType() == ClusterNodeType.ELASTIC)
              .sorted(Comparator.comparingInt(ClusterNode::getRank)).toList();

      upgradeNodes(selfManagedCluster, clusterNodes, clusterUpgradeJob);
    } else {
      throw new BadRequestException("Upgrade not supported for cluster");
    }
    return new ClusterUpgradeResponse("Cluster upgrade started");
  }

  public ClusterInfoResponse upgradeInfo(String clusterId) {
    ClusterUpgradeJob activeUpgradeJob = null;
    try {
      activeUpgradeJob = clusterUpgradeJobService.getActiveJobByClusterId(clusterId);
    } catch (Exception e) {
      log.error("Failed to retrieve active job for clusterId: {}", clusterId, e);
    }
    try {
      ElasticClient client = elasticsearchClientProvider.getElasticsearchClientByClusterId(clusterId);
      KibanaClient kibanaClient = kibanaClientProvider.getKibanaClientByClusterId(clusterId);
      GetClusterResponse cluster = clusterService.getClusterById(clusterId);
      PrecheckStatus precheckStatus = null;
      if (activeUpgradeJob != null) {
        GetPrecheckGroupResponse latestPrecheckGroup = precheckRunService.getPrecheckGroupByJobId(activeUpgradeJob.getId());
        if (latestPrecheckGroup == null) {
          precheckSchedulerService.schedule(clusterId);
          precheckStatus = PrecheckStatus.RUNNING;
        } else {
          precheckStatus = precheckRunService.getGroupStatus(latestPrecheckGroup.id());
        }
      } else {
        precheckStatus = PrecheckStatus.COMPLETED;
      }

      List<GetElasticsearchSnapshotResponse> snapshots = client.getValidSnapshots();

      ClusterInfoResponse.DeprecationCounts kibanaDeprecationCounts = deprecationService.getKibanaDeprecationCounts(clusterId);
      ClusterInfoResponse.DeprecationCounts elasticDeprecationCounts = deprecationService.getElasticDeprecationCounts(clusterId);

      boolean isClusterUpgraded = activeUpgradeJob != null && activeUpgradeJob.getStatus() == ClusterUpgradeStatus.UPDATED;
      clusterService.syncClusterState(clusterId);
      // Evaluate upgrade status
      boolean isESUpgraded = isClusterUpgraded || clusterService.isNodesUpgraded(clusterId, ClusterNodeType.ELASTIC);
      boolean isKibanaUpgraded = isClusterUpgraded || clusterService.isNodesUpgraded(clusterId, ClusterNodeType.KIBANA);

      boolean isElasticUpgradable = !isESUpgraded;
      boolean isKibanaUpgradable = !isKibanaUpgraded && isESUpgraded;

      ClusterInfoResponse.Elastic elastic = new ClusterInfoResponse.Elastic(isElasticUpgradable, elasticDeprecationCounts,
          new ClusterInfoResponse.Elastic.SnapshotWrapper(snapshots.isEmpty() ? null : snapshots.getFirst(),
              kibanaClient.getSnapshotCreationPageUrl()));

      ClusterInfoResponse.Kibana kibana = new ClusterInfoResponse.Kibana(isKibanaUpgradable, kibanaDeprecationCounts);

      ClusterInfoResponse.Precheck precheck = new ClusterInfoResponse.Precheck(precheckStatus);
      String deploymentId = cluster instanceof GetElasticCloudClusterResponse elasticCloud ? elasticCloud.getDeploymentId() : null;
      return new ClusterInfoResponse(elastic, kibana, precheck, deploymentId);
    } catch (Exception e) {
      log.error("Failed to get upgrade info for clusterId: {}", clusterId, e);
      throw new RuntimeException(e);
    }
  }

  private void upgradeNodes(SelfManagedCluster cluster, List<ClusterNode> nodes, ClusterUpgradeJob clusterUpgradeJob) {

    executorService.submit(() -> {
      try {
        lock.lock();

        ElasticClient elasticClient = elasticsearchClientProvider.getClient(cluster);
        KibanaClient kibanaClient = kibanaClientProvider.getClient(cluster);

        for (ClusterNode node : nodes.stream().sorted(Comparator.comparingInt(ClusterNode::getRank)).toList()) {
          if (NodeUpgradeStatus.UPGRADED == node.getStatus()) {
            log.info("Skipping node with [NodeId: {}] as its already updated", node.getId());
            continue;
          }
          Configuration config = new Configuration(9300, 9200, cluster.getSshInfo().username(), cluster.getSshInfo().keyPath(),
              clusterUpgradeJob.getTargetVersion());
          Context context = new Context(node, config, log, elasticClient, kibanaClient);

          UpgradePlanBuilder upgradePlanBuilder = new UpgradePlanBuilder();

          List<Task> tasks = upgradePlanBuilder.buildPlanFor(node);
          double seq = 0.0;
          node.setStatus(NodeUpgradeStatus.UPGRADING);
          updateNodeProgress(node, 0);

          for (Task task : tasks) {
            try {
              log.info("Task [taskId: {}] [Sequence: {}] [NodeIp: {}] Starting task", task.getId(), seq, node.getIp());
              TaskResult result = task.run(context);
              System.out.println(result);
              log.info("Task [taskId: {}] [Sequence: {}] [NodeIp: {}] [Success: {}]  Result: {}", task.getId(), seq, node.getIp(),
                  result.isSuccess(), result);
              if (!result.isSuccess()) {
                node.setStatus(NodeUpgradeStatus.FAILED);
                updateNodeProgress(node, (int) ((seq / tasks.size()) * 100));


                notifyNodeUpgradeFailed(node);
                throw new RuntimeException(result.getMessage());
              }
              seq++;
              updateNodeProgress(node, (int) ((seq / tasks.size()) * 100));
              Thread.sleep(2000);
            } finally {
              notificationService.sendNotification(new UpgradeProgressChangeEvent());
            }
          }

          node.setVersion(config.targetVersion());
          node.setStatus(NodeUpgradeStatus.UPGRADED);
          updateNodeProgress(node, 100);
          notifyNodeUpgradedSuccessfully(cluster, node);
        }

        if (nodes.size() > 1) {
          notifyClusterUpgradedSuccessFully(cluster);
        }

      } catch (Exception e) {
        if (nodes.size() > 1) {
          notifyClusterUpgradeFailed(cluster);
        }
        log.error("[ClusterId: {}] Cluster upgrade failed", cluster.getId(), e);
      } finally {
        clusterService.syncClusterState(cluster.getId());
        syncUpgradeJobStatus(cluster, clusterUpgradeJob);
        notificationService.sendNotification(new UpgradeProgressChangeEvent());
        lock.unlock();
      }
    });
  }

  private void syncUpgradeJobStatus(SelfManagedCluster cluster, ClusterUpgradeJob clusterUpgradeJob) {
    List<GetClusterNodeResponse> nodes = clusterService.getNodes(cluster.getId(), null).stream()
        .filter(node -> node.status() != NodeUpgradeStatus.UPGRADED && !clusterUpgradeJob.getTargetVersion().equals(node.version()))
        .toList();
    if (nodes.isEmpty()) {
      clusterUpgradeJob.setStatus(ClusterUpgradeStatus.UPDATED);
      clusterUpgradeJobRepository.save(clusterUpgradeJob);
    }
  }

  private void notifyClusterUpgradedSuccessFully(SelfManagedCluster cluster) {
    String clusterName = cluster.getName(); // Optional: include name if available

    String message = String.format("Cluster '%s' has been successfully upgraded to the target version.", clusterName);
    String subject = String.format("Cluster '%s' upgraded", clusterName);

    notificationService.sendNotification(new GeneralNotificationEvent(NotificationType.SUCCESS, message, subject, cluster.getId()));
    notificationService.sendNotification(new UpgradeProgressChangeEvent());

  }

  private void notifyClusterUpgradeFailed(SelfManagedCluster cluster) {
    String clusterName = cluster.getName(); // Optional if available

    String message = String.format("Cluster '%s' failed to upgrade to the target version. Please investigate the issue.", clusterName);
    String subject = String.format("Cluster '%s' upgrade failed", clusterName);

    notificationService.sendNotification(new GeneralNotificationEvent(NotificationType.ERROR, message, subject, cluster.getId()));
    notificationService.sendNotification(new UpgradeProgressChangeEvent());

  }

  private void notifyNodeUpgradeFailed(ClusterNode node) {
    String message = String.format("Failed to upgrade node '%s' to the target version. Please check logs for details.", node.getName());

    notificationService.sendNotification(
        new GeneralNotificationEvent(NotificationType.ERROR, message, String.format("Node '%s' upgrade failed", node.getName()),
            node.getClusterId()));
    notificationService.sendNotification(new UpgradeProgressChangeEvent());

  }

  private void notifyNodeUpgradedSuccessfully(SelfManagedCluster cluster, ClusterNode node) {
    notificationService.sendNotification(new UpgradeProgressChangeEvent());
    String message = String.format("Node '%s' has been successfully upgraded to the target version.", node.getName());
    notificationService.sendNotification(
        new GeneralNotificationEvent(NotificationType.SUCCESS, message, String.format("Node '%s' upgraded", node.getName()),
            cluster.getId()));
  }

  private void updateNodeProgress(ClusterNode node, int progress) {
    node.setProgress(progress);
    clusterNodeRepository.save(node);
    notificationService.sendNotification(new UpgradeProgressChangeEvent());
  }
}

package co.hyperflex.upgrade.services;


import co.hyperflex.core.entites.clusters.SelfManagedClusterEntity;
import co.hyperflex.core.repositories.ClusterNodeRepository;
import co.hyperflex.core.repositories.ClusterRepository;
import co.hyperflex.core.services.clusters.lock.ClusterLockService;
import co.hyperflex.core.services.notifications.GeneralNotificationEvent;
import co.hyperflex.core.services.notifications.NotificationService;
import co.hyperflex.core.services.notifications.NotificationType;
import co.hyperflex.upgrade.tasks.Configuration;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.elastic.RestartElasticsearchServiceTask;
import co.hyperflex.upgrade.tasks.kibana.RestartKibanaServiceTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NodeUpgradeService {
  private static final Logger LOG = LoggerFactory.getLogger(NodeUpgradeService.class);
  private final ClusterLockService clusterLockService;
  private final NotificationService notificationService;
  private final ClusterRepository clusterRepository;
  private final ClusterNodeRepository clusterNodeRepository;

  public NodeUpgradeService(ClusterLockService clusterLockService, NotificationService notificationService,
                            ClusterRepository clusterRepository, ClusterNodeRepository clusterNodeRepository) {
    this.clusterLockService = clusterLockService;
    this.notificationService = notificationService;
    this.clusterRepository = clusterRepository;
    this.clusterNodeRepository = clusterNodeRepository;
  }

  public void restartNode(String clusterId, String nodeId) {
    try {
      clusterLockService.lock(clusterId);
      var cluster = (SelfManagedClusterEntity) clusterRepository.getCluster(clusterId);
      var node = clusterNodeRepository.findById(nodeId).orElseThrow();
      var config = new Configuration(9300, 9200, cluster.getSshInfo(), null);
      var context = new Context(node, config, LOG, null, null);
      var result = switch (node.getType()) {
        case ELASTIC -> new RestartElasticsearchServiceTask().run(context);
        case KIBANA -> new RestartKibanaServiceTask().run(context);
      };
      if (result.success()) {
        LOG.info("Node [NodeId: {}] restarted successfully", node.getId());
        notificationService.sendNotification(new GeneralNotificationEvent(
            NotificationType.SUCCESS,
            "Node restarted",
            node.getName() + " node restarted successfully",
            cluster.getId()
        ));
      } else {
        LOG.warn("Node [NodeId: {}] restart failed", node.getId());
        notificationService.sendNotification(new GeneralNotificationEvent(
            NotificationType.ERROR,
            "Node restart failed",
            node.getName() + " node failed to restart",
            cluster.getId()
        ));
      }
    } finally {
      clusterLockService.unlock(clusterId);
    }
  }

}

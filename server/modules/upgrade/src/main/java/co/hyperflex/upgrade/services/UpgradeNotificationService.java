package co.hyperflex.upgrade.services;

import co.hyperflex.core.entites.clusters.SelfManagedClusterEntity;
import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.core.services.notifications.GeneralNotificationEvent;
import co.hyperflex.core.services.notifications.NotificationService;
import co.hyperflex.core.services.notifications.NotificationType;
import co.hyperflex.core.services.notifications.UpgradeProgressChangeEvent;
import org.springframework.stereotype.Service;

@Service
public class UpgradeNotificationService {

  private final NotificationService notificationService;

  public UpgradeNotificationService(NotificationService notificationService) {
    this.notificationService = notificationService;
  }

  public void notifyClusterUpgradedSuccessfully(SelfManagedClusterEntity cluster) {
    String clusterName = cluster.getName();
    String message = String.format(
        "Cluster '%s' has been successfully upgraded to the target version.", clusterName);
    String subject = String.format("Cluster '%s' upgraded", clusterName);

    sendGeneralNotification(NotificationType.SUCCESS, message, subject, cluster.getId());
  }

  public void notifyClusterUpgradeStopped(SelfManagedClusterEntity cluster) {
    String clusterName = cluster.getName();
    String message = String.format("Cluster '%s' upgrade has been stopped.", clusterName);
    String subject = String.format("Cluster '%s' upgrade stopped", clusterName);

    sendGeneralNotification(NotificationType.WARNING, message, subject, cluster.getId());
  }

  public void notifyClusterUpgradeFailed(SelfManagedClusterEntity cluster) {
    String clusterName = cluster.getName();
    String message = String.format(
        "Cluster '%s' failed to upgrade to the target version. Please investigate the issue.",
        clusterName);
    String subject = String.format("Cluster '%s' upgrade failed", clusterName);

    sendGeneralNotification(NotificationType.ERROR, message, subject, cluster.getId());
  }

  public void notifyNodeUpgradeFailed(ClusterNodeEntity node) {
    String message = String.format(
        "Failed to upgrade node '%s' to the target version. Please check logs for details.",
        node.getName());

    sendGeneralNotification(
        NotificationType.ERROR,
        message,
        String.format("Node '%s' upgrade failed", node.getName()),
        node.getClusterId());
  }

  public void notifyNodeUpgradedSuccessfully(SelfManagedClusterEntity cluster, ClusterNodeEntity node) {
    String message = String.format(
        "Node '%s' has been successfully upgraded to the target version.",
        node.getName());

    sendGeneralNotification(
        NotificationType.SUCCESS,
        message,
        String.format("Node '%s' upgraded", node.getName()),
        cluster.getId());
  }

  public void sendProgressChangeEvent() {
    notificationService.sendNotification(new UpgradeProgressChangeEvent());
  }

  private void sendGeneralNotification(NotificationType type, String message, String subject, String clusterId) {
    notificationService.sendNotification(new GeneralNotificationEvent(type, message, subject, clusterId));
    sendProgressChangeEvent();
  }
}

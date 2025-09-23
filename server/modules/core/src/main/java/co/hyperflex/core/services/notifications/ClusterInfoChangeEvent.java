package co.hyperflex.core.services.notifications;

public class ClusterInfoChangeEvent implements NotificationEvent {
  @Override
  public NotificationEventType getType() {
    return NotificationEventType.CLUSTER_INFO_CHANGE;
  }
}
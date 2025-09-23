package co.hyperflex.core.services.notifications;

public class UpgradeJobCreatedEvent implements NotificationEvent {
  private final String upgradeJobId;
  private final String clusterId;

  public UpgradeJobCreatedEvent(String upgradeJobId, String clusterId) {
    this.upgradeJobId = upgradeJobId;
    this.clusterId = clusterId;
  }

  @Override
  public NotificationEventType getType() {
    return NotificationEventType.UPGRADE_JOB_CREATED;
  }

  public String getUpgradeJobId() {
    return upgradeJobId;
  }

  public String getClusterId() {
    return clusterId;
  }
}

package co.hyperflex.core.services.notifications;

public class UpgradeProgressChangeEvent implements NotificationEvent {
  @Override
  public NotificationEventType getType() {
    return NotificationEventType.UPGRADE_PROGRESS_CHANGE;
  }
}

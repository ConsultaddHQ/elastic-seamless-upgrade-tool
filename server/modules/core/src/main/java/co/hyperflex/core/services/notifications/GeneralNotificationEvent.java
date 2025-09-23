package co.hyperflex.core.services.notifications;

public class GeneralNotificationEvent implements NotificationEvent {
  private final NotificationType notificationType;
  private final String message;
  private final String title;
  private final String clusterId;

  public GeneralNotificationEvent(NotificationType notificationType, String message, String title,
                                  String clusterId) {
    this.notificationType = notificationType;
    this.message = message;
    this.title = title;
    this.clusterId = clusterId;
  }

  @Override
  public NotificationEventType getType() {
    return NotificationEventType.NOTIFICATION;
  }

  public NotificationType getNotificationType() {
    return notificationType;
  }

  public String getMessage() {
    return message;
  }

  public String getTitle() {
    return title;
  }

  public String getClusterId() {
    return clusterId;
  }
}

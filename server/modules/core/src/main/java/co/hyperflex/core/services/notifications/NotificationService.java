package co.hyperflex.core.services.notifications;

import java.util.LinkedList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
  private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
  private final List<NotificationListener> listeners = new LinkedList<>();

  public void sendNotification(NotificationEvent notification) {
    for (NotificationListener listener : listeners) {
      try {
        listener.onNotification(notification);
        if (notification instanceof UpgradeProgressChangeEvent) {
          listener.onNotification(new ClusterInfoChangeEvent());
        }
      } catch (Exception e) {
        log.warn(e.getMessage());
      }
    }
  }

  public void addNotificationListener(NotificationListener listener) {
    listeners.add(listener);
  }

  public void removeNotificationListener(NotificationListener listener) {
    listeners.removeIf(existing -> existing == listener);
  }

  public interface NotificationListener {
    void onNotification(NotificationEvent notification);
  }
}

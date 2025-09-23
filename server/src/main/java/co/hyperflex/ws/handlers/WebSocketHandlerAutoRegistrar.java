package co.hyperflex.ws.handlers;

import co.hyperflex.core.services.notifications.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class WebSocketHandlerAutoRegistrar {
  private static final Logger log = LoggerFactory.getLogger(WebSocketHandlerAutoRegistrar.class);

  public WebSocketHandlerAutoRegistrar(PrecheckWebSocketHandler webSocketHandler,
                                       NotificationService notificationService,
                                       ObjectMapper objectMapper) {
    notificationService.addNotificationListener(notification -> {
      try {
        String data = objectMapper.writeValueAsString(notification);
        webSocketHandler.sendMessageToAll(data);
      } catch (Exception e) {
        log.warn("Failed to register notification listener", e);
      }
    });
  }


}

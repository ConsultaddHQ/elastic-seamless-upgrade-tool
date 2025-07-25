package co.hyperflex.ws.handlers;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class PrecheckWebSocketHandler extends TextWebSocketHandler {
  private final Logger logger = LoggerFactory.getLogger(getClass());

  private final Set<WebSocketSession> sessions =
      Collections.newSetFromMap(new ConcurrentHashMap<>());

  @Override
  public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    sessions.add(session);
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
    sessions.remove(session);
  }

  public void sendMessageToAll(String message) {
    sessions.forEach(session -> {
      try {
        if (session.isOpen()) {
          session.sendMessage(new TextMessage(message));
        }
      } catch (Exception e) {
        logger.error("Failed to send message to websocket", e);
      }
    });
  }
}

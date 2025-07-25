package co.hyperflex.services;

import co.hyperflex.ws.handlers.PrecheckWebSocketHandler;
import org.springframework.stereotype.Service;

@Service
public class RealtimeUpdateService {
  private final PrecheckWebSocketHandler webSocketHandler;

  public RealtimeUpdateService(PrecheckWebSocketHandler webSocketHandler) {
    this.webSocketHandler = webSocketHandler;
  }

  public void notifyStatusChange(String precheckId, String status) {
    String payload =
        String.format("{\"precheckId\": \"%s\", \"status\": \"%s\"}", precheckId, status);
    webSocketHandler.sendMessageToAll(payload);
  }


}

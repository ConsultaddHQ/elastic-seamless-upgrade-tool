package co.hyperflex.clients.elastic.dto.cluster;

public class PutClusterSettingsResponse {
  private boolean acknowledged;

  public boolean isAcknowledged() {
    return acknowledged;
  }

  public void setAcknowledged(boolean acknowledged) {
    this.acknowledged = acknowledged;
  }
}
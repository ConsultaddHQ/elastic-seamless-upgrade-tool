package co.hyperflex.clients.elastic.dto.cat.health;


import jakarta.annotation.Nullable;

public class HealthRecord {
  @Nullable
  private String status;

  @Nullable
  public String getStatus() {
    return status;
  }

  public void setStatus(@Nullable String status) {
    this.status = status;
  }
}

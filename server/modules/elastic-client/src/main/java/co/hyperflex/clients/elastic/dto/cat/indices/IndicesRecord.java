package co.hyperflex.clients.elastic.dto.cat.indices;


import jakarta.annotation.Nullable;

public class IndicesRecord {
  @Nullable
  private String health;

  @Nullable
  private String status;

  @Nullable
  private String index;

  @Nullable
  public String getHealth() {
    return health;
  }

  public void setHealth(@Nullable String health) {
    this.health = health;
  }

  @Nullable
  public String getStatus() {
    return status;
  }

  public void setStatus(@Nullable String status) {
    this.status = status;
  }

  @Nullable
  public String getIndex() {
    return index;
  }

  public void setIndex(@Nullable String index) {
    this.index = index;
  }
}

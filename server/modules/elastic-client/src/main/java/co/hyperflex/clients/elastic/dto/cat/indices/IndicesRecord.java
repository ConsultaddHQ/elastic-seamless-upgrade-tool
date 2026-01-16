package co.hyperflex.clients.elastic.dto.cat.indices;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.Nullable;

public class IndicesRecord {
  @Nullable
  private String health;

  @Nullable
  private String status;

  @Nullable
  private String index;

  @Nullable
  @JsonProperty("docs.count")
  private String docsCount;

  @Nullable
  @JsonProperty("store.size")
  private String docsSize;

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

  @Nullable
  public String getDocsCount() {
    return docsCount;
  }

  public void setDocsCount(@Nullable String docsCount) {
    this.docsCount = docsCount;
  }

  @Nullable
  public String getDocsSize() {
    return docsSize;
  }

  public void setDocsSize(@Nullable String docsSize) {
    this.docsSize = docsSize;
  }
}

package co.hyperflex.clients.elastic.dto.nodes;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.Nullable;

public class Process {
  @Nullable
  @JsonProperty("open_file_descriptors")
  private Integer openFileDescriptors;

  @Nullable
  @JsonProperty("max_file_descriptors")
  private Integer maxFileDescriptors;

  @Nullable
  private Long timestamp;

  @Nullable
  public Integer getOpenFileDescriptors() {
    return openFileDescriptors;
  }

  public void setOpenFileDescriptors(@Nullable Integer openFileDescriptors) {
    this.openFileDescriptors = openFileDescriptors;
  }

  @Nullable
  public Integer getMaxFileDescriptors() {
    return maxFileDescriptors;
  }

  public void setMaxFileDescriptors(@Nullable Integer maxFileDescriptors) {
    this.maxFileDescriptors = maxFileDescriptors;
  }

  @Nullable
  public Long getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(@Nullable Long timestamp) {
    this.timestamp = timestamp;
  }
}

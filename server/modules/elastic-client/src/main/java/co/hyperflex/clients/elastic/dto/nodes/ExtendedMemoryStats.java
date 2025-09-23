package co.hyperflex.clients.elastic.dto.nodes;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ExtendedMemoryStats {
  @JsonProperty("total_in_bytes")
  private long totalInBytes;
  @JsonProperty("free_in_bytes")
  private long freeInBytes;

  public long getTotalInBytes() {
    return totalInBytes;
  }

  public void setTotalInBytes(long totalInBytes) {
    this.totalInBytes = totalInBytes;
  }

  public long getFreeInBytes() {
    return freeInBytes;
  }

  public void setFreeInBytes(long freeInBytes) {
    this.freeInBytes = freeInBytes;
  }
}

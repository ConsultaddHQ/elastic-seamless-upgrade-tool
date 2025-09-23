package co.hyperflex.clients.elastic.dto.nodes;

import com.fasterxml.jackson.annotation.JsonProperty;

public class JvmMemoryStats {
  @JsonProperty("heap_used_in_bytes")
  private Long heapUsedInBytes;
  @JsonProperty("heap_max_in_bytes")
  private Long heapMaxInBytes;
  @JsonProperty("heap_init_in_bytes")
  private Long heapInitInBytes;

  public Long getHeapUsedInBytes() {
    return heapUsedInBytes;
  }

  public void setHeapUsedInBytes(Long heapUsedInBytes) {
    this.heapUsedInBytes = heapUsedInBytes;
  }

  public Long getHeapMaxInBytes() {
    return heapMaxInBytes;
  }

  public void setHeapMaxInBytes(Long heapMaxInBytes) {
    this.heapMaxInBytes = heapMaxInBytes;
  }

  public Long getHeapInitInBytes() {
    return heapInitInBytes;
  }

  public void setHeapInitInBytes(Long heapInitInBytes) {
    this.heapInitInBytes = heapInitInBytes;
  }
}

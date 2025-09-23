package co.hyperflex.clients.elastic.dto.cluster;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.Nullable;

public class AllocationExplainResponse {
  @Nullable
  @JsonProperty("allocate_explanation")
  private String allocateExplanation;

  @Nullable
  public String getAllocateExplanation() {
    return allocateExplanation;
  }

  public void setAllocateExplanation(@Nullable String allocateExplanation) {
    this.allocateExplanation = allocateExplanation;
  }
}

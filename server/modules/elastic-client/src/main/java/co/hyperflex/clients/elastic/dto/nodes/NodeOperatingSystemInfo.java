package co.hyperflex.clients.elastic.dto.nodes;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.Nullable;

public class NodeOperatingSystemInfo {
  private String arch;
  @JsonProperty("available_processors")
  private int availableProcessors;
  @Nullable
  @JsonProperty("allocated_processors")
  private Integer allocatedProcessors;
  private String name;
  @JsonProperty("pretty_name")
  private String prettyName;
  @JsonProperty("refresh_interval_in_millis")
  private long refreshIntervalInMillis;

  private String version;

  public String getArch() {
    return arch;
  }

  public void setArch(String arch) {
    this.arch = arch;
  }

  public int getAvailableProcessors() {
    return availableProcessors;
  }

  public void setAvailableProcessors(int availableProcessors) {
    this.availableProcessors = availableProcessors;
  }

  @Nullable
  public Integer getAllocatedProcessors() {
    return allocatedProcessors;
  }

  public void setAllocatedProcessors(@Nullable Integer allocatedProcessors) {
    this.allocatedProcessors = allocatedProcessors;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getPrettyName() {
    return prettyName;
  }

  public void setPrettyName(String prettyName) {
    this.prettyName = prettyName;
  }

  public long getRefreshIntervalInMillis() {
    return refreshIntervalInMillis;
  }

  public void setRefreshIntervalInMillis(long refreshIntervalInMillis) {
    this.refreshIntervalInMillis = refreshIntervalInMillis;
  }

  public String getVersion() {
    return version;
  }

  public void setVersion(String version) {
    this.version = version;
  }
}

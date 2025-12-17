package co.hyperflex.clients.kibana.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OsStats(String platform, String platformRelease, Load load, Memory memory,
                      long uptimeInMillis, String distro, String distroRelease) {
  public record Load(
      @JsonProperty("1m") double oneMinute,
      @JsonProperty("5m") double fiveMinute,
      @JsonProperty("15m") double fifteenMinute
  ) {
  }

  public record Memory(
      @JsonProperty("total_in_bytes") long totalInBytes,
      @JsonProperty("free_in_bytes") long freeInBytes,
      @JsonProperty("used_in_bytes") long usedInBytes
  ) {
  }
}

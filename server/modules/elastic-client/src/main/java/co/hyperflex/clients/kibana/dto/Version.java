package co.hyperflex.clients.kibana.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record Version(
    String number,
    @JsonProperty("build_hash") String buildHash,
    @JsonProperty("build_number") int buildNumber,
    @JsonProperty("build_snapshot") boolean buildSnapshot
) {
}

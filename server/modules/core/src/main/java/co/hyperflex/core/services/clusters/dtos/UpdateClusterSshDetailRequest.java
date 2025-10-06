package co.hyperflex.core.services.clusters.dtos;

import jakarta.validation.constraints.NotNull;

public record UpdateClusterSshDetailRequest(
    @NotNull String username,
    @NotNull String key) {
}

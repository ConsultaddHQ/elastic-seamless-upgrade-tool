package co.hyperflex.core.services.clusters.dtos;

import jakarta.validation.constraints.NotNull;

public record UpdateNodeConfigurationRequest(@NotNull String config) {
}

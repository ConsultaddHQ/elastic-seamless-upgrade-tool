package co.hyperflex.core.services.upgrade.dtos;

import jakarta.validation.constraints.NotNull;

public record GetUpgradeLogsRequest(
    @NotNull String clusterId,
    @NotNull String nodeId
) {
}

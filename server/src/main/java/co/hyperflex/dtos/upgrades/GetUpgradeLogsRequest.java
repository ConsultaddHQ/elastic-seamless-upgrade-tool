package co.hyperflex.dtos.upgrades;

import jakarta.validation.constraints.NotNull;

public record GetUpgradeLogsRequest(
    @NotNull String clusterId,
    @NotNull String nodeId
) {
}

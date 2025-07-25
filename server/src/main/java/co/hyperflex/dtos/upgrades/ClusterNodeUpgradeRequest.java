package co.hyperflex.dtos.upgrades;

import jakarta.validation.constraints.NotNull;

public record ClusterNodeUpgradeRequest(
    @NotNull String clusterId,
    @NotNull String nodeId
) {
}

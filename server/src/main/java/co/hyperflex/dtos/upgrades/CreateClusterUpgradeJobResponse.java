package co.hyperflex.dtos.upgrades;

import jakarta.validation.constraints.NotNull;

public record CreateClusterUpgradeJobResponse(
    @NotNull String message,
    @NotNull String id
) {
}

package co.hyperflex.core.services.upgrade.dtos;

import jakarta.validation.constraints.NotNull;

public record CreateClusterUpgradeJobResponse(
    @NotNull String message,
    @NotNull String id,
    @NotNull boolean isValidUpgradePath
) {
}

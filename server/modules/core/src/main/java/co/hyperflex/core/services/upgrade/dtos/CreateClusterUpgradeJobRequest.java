package co.hyperflex.core.services.upgrade.dtos;

import jakarta.validation.constraints.NotNull;

public record CreateClusterUpgradeJobRequest(
    @NotNull String targetVersion
) {
}

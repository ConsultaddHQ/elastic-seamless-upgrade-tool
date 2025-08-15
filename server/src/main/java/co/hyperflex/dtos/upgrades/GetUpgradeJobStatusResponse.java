package co.hyperflex.dtos.upgrades;

import co.hyperflex.entities.upgrade.ClusterUpgradeStatus;
import jakarta.validation.constraints.NotNull;

public record GetUpgradeJobStatusResponse(
    @NotNull boolean isStopping,
    @NotNull ClusterUpgradeStatus status
) {
}

package co.hyperflex.core.services.upgrade.dtos;

import co.hyperflex.core.models.enums.ClusterUpgradeStatus;
import jakarta.validation.constraints.NotNull;

public record GetUpgradeJobStatusResponse(
    @NotNull boolean isStopping,
    @NotNull ClusterUpgradeStatus status
) {
}

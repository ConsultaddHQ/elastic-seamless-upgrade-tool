package co.hyperflex.dtos.upgrades;

import jakarta.validation.constraints.NotNull;

public record ClusterNodeUpgradeResponse(@NotNull String message) {
}

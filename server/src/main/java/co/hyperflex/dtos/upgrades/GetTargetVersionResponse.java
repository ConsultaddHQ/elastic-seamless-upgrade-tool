package co.hyperflex.dtos.upgrades;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record GetTargetVersionResponse(
    @Nullable String targetVersion,
    @NotNull boolean underUpgrade,
    @NotNull List<String> possibleUpgradeVersions
) {
}

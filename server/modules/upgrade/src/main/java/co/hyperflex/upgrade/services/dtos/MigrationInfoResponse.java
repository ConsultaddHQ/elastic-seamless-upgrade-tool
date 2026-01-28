package co.hyperflex.upgrade.services.dtos;

import co.hyperflex.upgrade.services.migration.GetFeatureMigrationResponse;
import java.util.List;

public record MigrationInfoResponse(
    boolean isValidUpgradePath,
    GetFeatureMigrationResponse systemIndices,
    List<IndexReindexInfo> reindexNeedingIndices,
    ReindexStatus reindexStatus
) {
}

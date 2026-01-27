package co.hyperflex.upgrade.services.dtos;

import co.hyperflex.breakingchanges.services.deprecations.dtos.DeprecationCounts;
import co.hyperflex.clients.elastic.dto.GetElasticsearchSnapshotResponse;
import co.hyperflex.precheck.core.enums.PrecheckStatus;
import co.hyperflex.upgrade.services.migration.CustomIndexMigrationStatus;
import co.hyperflex.upgrade.services.migration.FeatureMigrationStatus;
import com.mongodb.lang.Nullable;
import jakarta.validation.constraints.NotNull;

public record ClusterInfoResponse(
    @NotNull Elastic elastic,
    @NotNull Kibana kibana,
    @NotNull Precheck precheck,
    @Nullable String deploymentId,
    boolean isValidUpgradePath,
    @Nullable FeatureMigration featureMigration, CustomIndexMigration customIndexMigration) {
  public record Elastic(
      boolean isUpgradable,
      DeprecationCounts deprecationCounts,
      SnapshotWrapper snapshot
  ) {
    public record SnapshotWrapper(
        GetElasticsearchSnapshotResponse snapshot,
        String creationPage
    ) {
    }
  }

  public record Kibana(
      @NotNull boolean isUpgradable,
      DeprecationCounts deprecationCounts
  ) {
  }


  public record Precheck(
      @NotNull PrecheckStatus status
  ) {
  }

  public record FeatureMigration(
      @NotNull FeatureMigrationStatus status
  ) {

  }

  public record CustomIndexMigration(
      @NotNull CustomIndexMigrationStatus status
  ) {

  }

}

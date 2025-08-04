package co.hyperflex.dtos;

import co.hyperflex.entities.precheck.PrecheckStatus;
import com.mongodb.lang.Nullable;
import jakarta.validation.constraints.NotNull;

public record ClusterInfoResponse(
    @NotNull Elastic elastic,
    @NotNull Kibana kibana,
    @NotNull Precheck precheck,
    @Nullable String deploymentId
    ) {
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

  public record DeprecationCounts(
      int critical,
      int warning
  ) {
  }

  public record Precheck(
      @NotNull PrecheckStatus status
  ) {
  }
}

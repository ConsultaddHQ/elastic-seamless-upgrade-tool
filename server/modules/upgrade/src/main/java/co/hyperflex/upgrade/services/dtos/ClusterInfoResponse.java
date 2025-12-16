package co.hyperflex.upgrade.services.dtos;

import co.hyperflex.clients.elastic.dto.GetElasticsearchSnapshotResponse;
import co.hyperflex.core.services.deprecations.dtos.DeprecationCounts;
import co.hyperflex.precheck.core.enums.PrecheckStatus;
import com.mongodb.lang.Nullable;
import jakarta.validation.constraints.NotNull;

public record ClusterInfoResponse(
    @NotNull Elastic elastic,
    @NotNull Kibana kibana,
    @NotNull Precheck precheck,
    @Nullable String deploymentId,
    boolean isValidUpgradePath) {
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
}

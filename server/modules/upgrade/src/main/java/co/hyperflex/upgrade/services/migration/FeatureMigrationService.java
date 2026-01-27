package co.hyperflex.upgrade.services.migration;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.utils.VersionUtils;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class FeatureMigrationService {
  private static final Logger log = LoggerFactory.getLogger(FeatureMigrationService.class);
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final ClusterUpgradeJobService clusterUpgradeJobService;

  public FeatureMigrationService(ElasticsearchClientProvider elasticsearchClientProvider,
                                 ClusterUpgradeJobService clusterUpgradeJobService) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
  }

  public FeatureMigrationResponse migrate(String clusterId) {
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    if (VersionUtils.isVersionGte(upgradeJob.getCurrentVersion(), "7.16.0")) {
      var client = elasticsearchClientProvider.getClient(clusterId);
      client.execute(ApiRequest.builder(JsonNode.class).post().uri("/_migration/system_features").build());
    }
    return new FeatureMigrationResponse();
  }

  public @NotNull GetFeatureMigrationResponse getFeatureMigrationResponse(String clusterId) {
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    if (VersionUtils.isVersionGte(upgradeJob.getCurrentVersion(), "7.16.0")) {
      var client = elasticsearchClientProvider.getClient(clusterId);
      var response = client.execute(ApiRequest.builder(JsonNode.class).get().uri("/_migration/system_features").build());
      var migrationStatus = response.get("migration_status").asText();
      return new GetFeatureMigrationResponse(FeatureMigrationStatus.valueOf(migrationStatus));
    } else {
      // This was generally available; Added in 7.16.0
      return new GetFeatureMigrationResponse(FeatureMigrationStatus.NO_MIGRATION_NEEDED);
    }
  }

}

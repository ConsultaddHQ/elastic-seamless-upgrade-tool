package co.hyperflex.upgrade.services.migration;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.core.exceptions.AppException;
import co.hyperflex.core.exceptions.HttpStatus;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.core.utils.VersionUtils;
import co.hyperflex.precheck.utils.IndexUtils;
import co.hyperflex.upgrade.services.dtos.IndexReindexInfo;
import co.hyperflex.upgrade.services.dtos.MigrationInfoResponse;
import co.hyperflex.upgrade.services.dtos.ReindexStatus;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class MigrationService {

  private static final Logger log = LoggerFactory.getLogger(MigrationService.class);
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final ClusterUpgradeJobService clusterUpgradeJobService;
  private final IndexUtils indexUtils;

  public MigrationService(ElasticsearchClientProvider elasticsearchClientProvider,
                          ClusterUpgradeJobService clusterUpgradeJobService,
                          IndexUtils indexUtils) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
    this.indexUtils = indexUtils;
  }

  public MigrationInfoResponse getMigrationInfo(String clusterId) {

    try {
      ClusterUpgradeJobEntity upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
      String currentVer = upgradeJob.getCurrentVersion();
      String targetVer = upgradeJob.getTargetVersion();

      boolean isValidUpgradePath = VersionUtils.isValidUpgrade(currentVer, targetVer);
      List<IndexReindexInfo> reindexNeedingIndices = getReindexIndicesMetadata(clusterId, upgradeJob);
      GetFeatureMigrationResponse featureMigrationResponse = getFeatureMigrationResponse(clusterId, upgradeJob);

      ReindexStatus status = determineReindexStatus(reindexNeedingIndices, isValidUpgradePath, currentVer, featureMigrationResponse);

      return new MigrationInfoResponse(
          isValidUpgradePath,
          featureMigrationResponse,
          reindexNeedingIndices,
          status
      );
    } catch (Exception e) {
      log.error("Failed to get migration info for cluster {}", clusterId, e);
      throw new AppException(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private ReindexStatus determineReindexStatus(List<IndexReindexInfo> indices, boolean isValidUpgradePath, String currentVer,
                                               GetFeatureMigrationResponse featureMigrationResponse) {
    if (indices.isEmpty()) {
      return new ReindexStatus(false, "No indices require reindexing");
    }
    if (!isValidUpgradePath) {
      return new ReindexStatus(false, "Currently in view only mode. Select valid target version.");
    }
    if (!VersionUtils.isVersionGte(currentVer, "8.18.0")) {
      return new ReindexStatus(false, "Direct reindexing available from 8.18.0. Manual reindex required.");
    }
    if (featureMigrationResponse.status() != FeatureMigrationStatus.NO_MIGRATION_NEEDED) {
      return new ReindexStatus(false, "First Migrate Features");
    }

    return new ReindexStatus(true, null);
  }

  public FeatureMigrationResponse migrate(String clusterId) {
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    if (VersionUtils.isVersionGte(upgradeJob.getCurrentVersion(), "7.16.0")) {
      var client = elasticsearchClientProvider.getClient(clusterId);
      client.execute(ApiRequest.builder(JsonNode.class).post().uri("/_migration/system_features").build());
    }
    return new FeatureMigrationResponse();
  }


  public List<IndexReindexInfo> getReindexIndicesMetadata(String clusterId, ClusterUpgradeJobEntity upgradeJob) {
    var client = elasticsearchClientProvider.getClient(clusterId);
    var indices = client.getIndices();
    int targetLucene = IndexUtils.mapEsVersionToLucene(upgradeJob.getTargetVersion());

    return indices.stream()
        .filter(indicesRecord -> !indexUtils.isLuceneCompatible(clusterId, indicesRecord.getIndex(), targetLucene))
        .map(indicesRecord -> new IndexReindexInfo(indicesRecord.getIndex(), indicesRecord.getDocsSize(), indicesRecord.getDocsCount()))
        .toList();
  }


  public @NotNull GetFeatureMigrationResponse getFeatureMigrationResponse(String clusterId, ClusterUpgradeJobEntity upgradeJob) {
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

  public IndexMigrationResponse reindexIndices(String clusterId) {
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    if (VersionUtils.isVersionGte(upgradeJob.getCurrentVersion(), "8.18.0")) {
      var client = elasticsearchClientProvider.getClient(clusterId);
      client.execute(ApiRequest.builder(JsonNode.class).post().uri("/_migration/reindex").build());
    }
    return new IndexMigrationResponse();
  }
}

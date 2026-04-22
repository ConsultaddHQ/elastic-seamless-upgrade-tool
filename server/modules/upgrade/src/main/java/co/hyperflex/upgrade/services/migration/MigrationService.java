package co.hyperflex.upgrade.services.migration;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.elastic.dto.cat.indices.IndicesRecord;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

    // -------------------------------------------------------------------------
    // 1. Dynamic Version Calculation
    // -------------------------------------------------------------------------
    // Example: "9.1.8" -> 9, "10.0.0" -> 10
    String targetVersion = upgradeJob.getTargetVersion();
    int targetMajorVersion = Integer.parseInt(targetVersion.split("\\.")[0]);

    // The oldest allowed major version is (Target - 1).
    // Multiply by 1,000,000 to match Elasticsearch's internal versioning format.
    long minAllowedVersionCode = (targetMajorVersion - 1) * 1000000L;

    // -------------------------------------------------------------------------
    // 2. Fetch Version AND Storage Tier in one bulk call
    // -------------------------------------------------------------------------
    // Added tier_preference to the filter_path
    String settingsUri =
        "/_all/_settings?filter_path=**.settings.index.version.created,"
            + "**.settings.index.routing.allocation.include._tier_preference&expand_wildcards=hidden,all";

    JsonNode settingsResponse = client.execute(
        ApiRequest.builder(JsonNode.class).get().uri(settingsUri).build()
    );

    // Use a Map to store the index name AND its storage tier
    Map<String, String> indicesToReindexWithTier = new HashMap<>();

    if (settingsResponse != null && settingsResponse.isObject()) {
      settingsResponse.fieldNames().forEachRemaining(indexName -> {
        JsonNode indexSettings = settingsResponse.path(indexName).path("settings").path("index");
        String createdVersionStr = indexSettings.path("version").path("created").asText();

        if (!createdVersionStr.isEmpty()) {
          long createdVersion = Long.parseLong(createdVersionStr);

          // Dynamic check: e.g., if target is 9.x, fails if createdVersion < 8000000
          if (createdVersion < minAllowedVersionCode) {

            // Extract Storage Tier (defaults to Hot if not explicitly set by ILM)
            String tier = "Hot";
            JsonNode tierNode = indexSettings.path("routing").path("allocation").path("include").path("_tier_preference");

            if (!tierNode.isMissingNode()) {
              String tierPref = tierNode.asText();
              if (tierPref.contains("data_frozen")) {
                tier = "Frozen";
              } else if (tierPref.contains("data_cold")) {
                tier = "Cold";
              } else if (tierPref.contains("data_warm")) {
                tier = "Warm";
              }
            }

            indicesToReindexWithTier.put(indexName, tier);
          }
        }
      });
    }

    // -------------------------------------------------------------------------
    // 3. Map to React UI payload
    // -------------------------------------------------------------------------
    List<IndicesRecord> allIndices = client.getIndices();

    return allIndices.stream()
        // Instantly filter out indices that don't need reindexing
        .filter(record -> indicesToReindexWithTier.containsKey(record.getIndex()))
        .map(record -> {
          String indexName = record.getIndex();

          boolean isSystem = indexName.startsWith(".");

          long docsCount = 0;
          try {
            if (record.getDocsCount() != null && !record.getDocsCount().isEmpty()) {
              docsCount = Long.parseLong(record.getDocsCount());
            }
          } catch (NumberFormatException e) {
            log.warn("Could not parse docsCount for index: {}", indexName);
          }

          String estimateSummary = docsCount > 5000000 ? "Hard" : (docsCount > 1000000 ? "Medium" : "Easy");
          String estimateTime = docsCount > 5000000 ? "12 hours" : (docsCount > 1000000 ? "1 hour" : "1 min");

          // Retrieve the tier we extracted from the settings API
          String storageTier = indicesToReindexWithTier.get(indexName);

          return new IndexReindexInfo(
              indexName,
              record.getDocsSize(),
              String.valueOf(docsCount),
              storageTier,
              isSystem,
              estimateSummary,
              estimateTime
          );
        })
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

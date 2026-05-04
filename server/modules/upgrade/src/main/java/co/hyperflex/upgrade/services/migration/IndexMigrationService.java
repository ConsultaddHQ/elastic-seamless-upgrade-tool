package co.hyperflex.upgrade.services.migration;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.elastic.dto.GetElasticDeprecationResponse;
import co.hyperflex.clients.elastic.dto.cat.indices.IndicesRecord;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.utils.VersionUtils;
import co.hyperflex.precheck.utils.IndexUtils;
import co.hyperflex.upgrade.services.dtos.IndexReindexInfo;
import co.hyperflex.upgrade.services.dtos.ReindexProgressInfo;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class IndexMigrationService {
  private static final Logger logger = LoggerFactory.getLogger(IndexMigrationService.class);
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final ClusterUpgradeJobService clusterUpgradeJobService;
  private final IndexUtils indexUtils;

  public IndexMigrationService(ElasticsearchClientProvider elasticsearchClientProvider,
                               ClusterUpgradeJobService clusterUpgradeJobService,
                               IndexUtils indexUtils) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
    this.indexUtils = indexUtils;
  }

  public IndexMigrationResponse migrate(String clusterId) {
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    if (VersionUtils.isVersionGte(upgradeJob.getCurrentVersion(), "8.18.0")) {
      var client = elasticsearchClientProvider.getClient(clusterId);
      client.execute(ApiRequest.builder(JsonNode.class).post().uri("/_migration/reindex").build());
    }
    return new IndexMigrationResponse();
  }

  public List<IndexReindexInfo> getReindexIndicesMetadata(String clusterId) {
    var client = elasticsearchClientProvider.getClient(clusterId);

    // 1. Fetch data from your Deprecations API
    GetElasticDeprecationResponse deprecations = client.getDeprecation();

    Set<String> incompatibleIndices = new HashSet<>();
    if (deprecations.indexSettings() != null) {
      incompatibleIndices.addAll(deprecations.indexSettings().keySet());
    }

    Set<String> incompatibleDataStreams = new HashSet<>();
    if (deprecations.dataStreams() != null) {
      incompatibleDataStreams.addAll(deprecations.dataStreams().keySet());
    }

    // 2. Fetch Settings specifically to keep the UI's Storage Tier column populated
    String settingsUri =
        "/_all/_settings?filter_path=**.settings.index.routing.allocation.include._tier_preference&expand_wildcards=hidden,all";
    JsonNode settingsResponse = client.execute(ApiRequest.builder(JsonNode.class).get().uri(settingsUri).build());
    Map<String, String> tierMap = extractStorageTiers(settingsResponse);

    // 3. Fetch sizes and document counts
    List<IndicesRecord> allIndices = client.getAllIndices();
    if (allIndices == null) {
      allIndices = List.of();
    }

    Map<String, IndicesRecord> indicesStatsMap = allIndices.stream()
        .filter(r -> r.getIndex() != null)
        .collect(Collectors.toMap(IndicesRecord::getIndex, r -> r, (r1, r2) -> r1));

    List<IndexReindexInfo> results = new ArrayList<>();

    // 4. Map Standard Indices
    for (String indexName : incompatibleIndices) {
      IndicesRecord record = indicesStatsMap.get(indexName);
      String tier = tierMap.getOrDefault(indexName, "Unknown");
      results.add(buildInfoObject(clusterId, indexName, record, tier, false));
    }

    // 5. Map Data Streams
    for (String dsName : incompatibleDataStreams) {
      results.add(buildInfoObject(clusterId, dsName, null, "Data Stream", true));
    }

    return results;
  }

  private Map<String, String> extractStorageTiers(JsonNode settingsResponse) {
    Map<String, String> map = new HashMap<>();
    if (settingsResponse != null && settingsResponse.isObject()) {
      settingsResponse.fieldNames().forEachRemaining(idx -> {
        JsonNode indexSettings = settingsResponse.path(idx).path("settings").path("index");
        map.put(idx, indexUtils.extractStorageTier(indexSettings));
      });
    }
    return map;
  }

  private IndexReindexInfo buildInfoObject(String clusterId, String name, IndicesRecord record, String storageTier, boolean isDataStream) {

    boolean isSystem = name.startsWith(".");
    long docsCount = 0L;
    String docsSize = "-";
    long rawBytesSize = 0L;

    if (record != null) {
      docsCount = Long.parseLong(record.getDocsCount());
      docsSize = record.getDocsSize();
      rawBytesSize = indexUtils.parseByteSize(docsSize);
    }

    String estimateSummary = indexUtils.calculateEstimateSummary(docsCount, rawBytesSize);
    String estimateTime = indexUtils.calculateEstimateTime(docsCount, rawBytesSize);

    return new IndexReindexInfo(
        name,
        docsSize,
        String.valueOf(docsCount),
        storageTier,
        isSystem,
        isDataStream,
        estimateSummary,
        estimateTime,
        checkAndUpdateReindexStatus(clusterId, name)
    );
  }

  public boolean safeDeleteIndex(String clusterId, String indexName) {

    try {
      var client = elasticsearchClientProvider.getClient(clusterId);

      // 1. CHECK ALIAS SAFETY
      JsonNode aliasResponse = client.execute(ApiRequest.builder(JsonNode.class)
          .get()
          .uri("/" + indexName + "/_alias")
          .build());

      if (aliasResponse != null && aliasResponse.has(indexName)) {
        JsonNode aliases = aliasResponse.get(indexName).path("aliases");

        var it = aliases.fieldNames();
        while (it.hasNext()) {
          String alias = it.next();
          boolean isWrite = aliases.get(alias).path("is_write_index").asBoolean(false);

          if (isWrite) {
            logger.warn("Skipping delete. [{}] is write index for alias [{}]", indexName, alias);
            return false;
          }
        }
      }

      // 2. DELETE
      return executeDelete(clusterId, indexName);

    } catch (Exception e) {
      logger.error("Safe delete failed [{}]: {}", indexName, e.getMessage());
      return false;
    }
  }

  /**
   * Executes the actual DELETE command using the custom ApiRequest.
   */
  private boolean executeDelete(String clusterId, String indexName) {
    logger.info("Executing DELETE command for index: [{}]", indexName);
    try {
      var client = elasticsearchClientProvider.getClient(clusterId);
      JsonNode response = client.execute(ApiRequest.builder(JsonNode.class)
          .delete()
          .uri("/" + indexName)
          .build());

      if (response != null && response.path("acknowledged").asBoolean(false)) {
        logger.info("Successfully deleted index: [{}]", indexName);
        return true;
      } else {
        logger.warn("Delete command acknowledged as false by cluster for index: [{}]", indexName);
        return false;
      }
    } catch (Exception e) {
      logger.error("Exception occurred during delete for index [{}]: {}", indexName, e.getMessage(), e);
      return false;
    }
  }

  /**
   * Safe Reindexing (handles data streams natively + manual standard indices).
   */
  public boolean safeReindexIndexAsync(String clusterId, String indexName) {
    logger.info("Initiating SAFE ASYNC reindex for [{}]", indexName);

    try {
      var client = elasticsearchClientProvider.getClient(clusterId);

      // 1. NATIVE DATA STREAM REINDEX
      if (indexUtils.isDataStream(clusterId, indexName)) {
        logger.info("Detected Data Stream. Using native Data Stream Reindex API for [{}]", indexName);

        // Uses the official Elasticsearch 8.x+ Data Stream Reindex API
        JsonNode response = client.execute(ApiRequest.builder(JsonNode.class)
            .post()
            .uri("/_data_stream/_reindex/" + indexName + "?wait_for_completion=false")
            .build());

        if (response != null && response.has("task")) {
          String taskId = response.get("task").asText();
          clusterUpgradeJobService.saveActiveReindexTask(clusterId, indexName, taskId);
          return true;
        }
        return false;
      }

      // 2. STANDARD INDEX REINDEX
      String destIndexName = indexName + "-reindexed";

      // Lock source index
      if (!applyWriteBlock(clusterId, indexName)) {
        logger.error("Failed to apply write block on [{}]", indexName);
        return false;
      }

      String body = String.format("""
          {
            "source": { "index": "%s" },
            "dest": { "index": "%s" }
          }
          """, indexName, destIndexName);

      JsonNode response = client.execute(ApiRequest.builder(JsonNode.class)
          .post()
          .uri("/_reindex?wait_for_completion=false")
          .body(body)
          .build());

      if (response != null && response.has("task")) {
        String taskId = response.get("task").asText();
        clusterUpgradeJobService.saveActiveReindexTask(clusterId, indexName, taskId);
        return true;
      }

    } catch (Exception e) {
      logger.error("Reindex failed [{}]: {}", indexName, e.getMessage(), e);
    }

    return false;
  }

  public ReindexProgressInfo checkAndUpdateReindexStatus(String clusterId, String indexName) {
    String taskId = clusterUpgradeJobService.getTaskIdForIndex(clusterId, indexName);

    if (taskId == null) {
      return new ReindexProgressInfo(false, null, 0, 0);
    }

    try {
      var client = elasticsearchClientProvider.getClient(clusterId);
      JsonNode response = client.execute(ApiRequest.builder(JsonNode.class)
          .get()
          .uri("/_tasks/" + taskId)
          .build());

      if (response != null) {
        boolean completed = response.path("completed").asBoolean(false);
        JsonNode status = response.path("task").path("status");

        if (completed) {
          logger.info("Reindex task completed for [{}]", indexName);

          // 1. DATA STREAM CLEANUP (Automatic)
          if (indexUtils.isDataStream(clusterId, indexName)) {
            logger.info("Data Stream [{}] was natively reindexed. No manual cleanup needed.", indexName);
            clusterUpgradeJobService.removeActiveReindexTask(clusterId, indexName);
            return new ReindexProgressInfo(false, null, 100, 0);
          }

          // 2. STANDARD INDEX CLEANUP (Manual Swaps)
          String destIndexName = indexName + "-reindexed";

          switchAliases(clusterId, indexName, destIndexName);
          safeDeleteIndex(clusterId, indexName);

          clusterUpgradeJobService.removeActiveReindexTask(clusterId, indexName);

          return new ReindexProgressInfo(false, null, 100, 0);
        }

        // Calculate active progress percentage
        long total = status.path("total").asLong(1);
        long processed = status.path("created").asLong(0)
            + status.path("updated").asLong(0)
            + status.path("deleted").asLong(0);

        int progress = (int) ((processed * 100) / total);
        return new ReindexProgressInfo(true, taskId, progress, total - processed);
      }

    } catch (Exception e) {
      logger.error("Task check failed [{}]: {}", taskId, e.getMessage());
    }

    return new ReindexProgressInfo(true, taskId, 0, 0);
  }

  // --- Helper Methods ---
  private boolean applyWriteBlock(String clusterId, String indexName) {
    try {
      var client = elasticsearchClientProvider.getClient(clusterId);

      return client.execute(ApiRequest.builder(JsonNode.class)
              .put()
              .uri("/" + indexName + "/_settings")
              .body("{\"index.blocks.write\": true}")
              .build())
          .path("acknowledged")
          .asBoolean(false);

    } catch (Exception e) {
      return false;
    }
  }


  private void switchAliases(String clusterId, String oldIndex, String newIndex) {
    try {
      var client = elasticsearchClientProvider.getClient(clusterId);

      JsonNode response = client.execute(ApiRequest.builder(JsonNode.class)
          .get()
          .uri("/" + oldIndex + "/_alias")
          .build());

      if (response == null || !response.has(oldIndex)) {
        return;
      }

      JsonNode aliases = response.get(oldIndex).path("aliases");

      if (aliases.isEmpty()) {
        return;
      }

      StringBuilder actions = new StringBuilder("{\"actions\":[");
      boolean first = true;

      var it = aliases.fieldNames();
      while (it.hasNext()) {
        String alias = it.next();
        boolean isWrite = aliases.get(alias).path("is_write_index").asBoolean(false);

        if (!first) {
          actions.append(",");
        }

        // REMOVE old
        actions.append(String.format(
            "{\"remove\":{\"index\":\"%s\",\"alias\":\"%s\"}},",
            oldIndex, alias
        ));

        // ADD new
        actions.append(String.format(
            "{\"add\":{\"index\":\"%s\",\"alias\":\"%s\",\"is_write_index\":%s}}",
            newIndex, alias, isWrite
        ));

        first = false;
      }

      actions.append("]}");

      client.execute(ApiRequest.builder(JsonNode.class)
          .post()
          .uri("/_aliases")
          .body(actions.toString())
          .build());

      logger.info("Aliases switched [{} -> {}]", oldIndex, newIndex);

    } catch (Exception e) {
      logger.error("Alias switch failed: {}", e.getMessage());
    }
  }
}
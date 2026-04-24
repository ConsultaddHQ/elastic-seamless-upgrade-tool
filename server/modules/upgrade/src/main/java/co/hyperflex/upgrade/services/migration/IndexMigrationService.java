package co.hyperflex.upgrade.services.migration;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.elastic.dto.cat.indices.IndicesRecord;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.utils.VersionUtils;
import co.hyperflex.precheck.utils.IndexUtils;
import co.hyperflex.upgrade.services.dtos.IndexReindexInfo;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class IndexMigrationService {
  private static final Logger log = LoggerFactory.getLogger(IndexMigrationService.class);

  // Regex to capture the base data stream name from a backing index.
  // Example: .ds-.logs-deprecation.elasticsearch-default-2026.04.22-000001
  // Group 1 extracts: .logs-deprecation.elasticsearch-default
  private static final Pattern DATA_STREAM_PATTERN = Pattern.compile("^\\.ds-(.+)-\\d{4}\\.\\d{2}\\.\\d{2}-\\d{6}$");

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
      client.execute(ApiRequest.builder(JsonNode.class).post().uri("\n" + "/_migration/reindex").build());

    }
    return new IndexMigrationResponse();
  }

  public List<IndexReindexInfo> getReindexIndicesMetadata(String clusterId) {
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    var client = elasticsearchClientProvider.getClient(clusterId);

    long minAllowedVersionCode = indexUtils.calculateMinAllowedVersionOfElasticForIndex(upgradeJob.getTargetVersion());

    // Fetch Settings
    String settingsUri = "/_all/_settings?filter_path=**.settings.index.version.created,"
        + "**.settings.index.routing.allocation.include._tier_preference&expand_wildcards=hidden,all";

    JsonNode settingsResponse = client.execute(
        ApiRequest.builder(JsonNode.class).get().uri(settingsUri).build()
    );

    // Map indices to their storage tier
    Map<String, String> indicesToReindexWithTier = parseIndicesNeedingReindex(settingsResponse, minAllowedVersionCode);

    // Fetch sizes and map to the UI payload
    List<IndicesRecord> allIndices = client.getAllIndices();

    return allIndices.stream()
        .filter(record -> indicesToReindexWithTier.containsKey(record.getIndex()))
        .map(record -> buildReindexInfo(record, indicesToReindexWithTier))
        .toList();
  }

  private Map<String, String> parseIndicesNeedingReindex(JsonNode settingsResponse, long minAllowedVersionCode) {
    Map<String, String> indicesToReindex = new HashMap<>();

    if (settingsResponse == null || !settingsResponse.isObject()) {
      return indicesToReindex;
    }

    settingsResponse.fieldNames().forEachRemaining(indexName -> {
      JsonNode indexSettings = settingsResponse.path(indexName).path("settings").path("index");
      long createdVersion = indexSettings.path("version").path("created").asLong(-1L);

      if (createdVersion != -1L && createdVersion < minAllowedVersionCode) {
        String tier = indexUtils.extractStorageTier(indexSettings);
        indicesToReindex.put(indexName, tier);
      }
    });

    return indicesToReindex;
  }

  private IndexReindexInfo buildReindexInfo(IndicesRecord record, Map<String, String> indicesTierMap) {
    String indexName = record.getIndex();
    assert indexName != null;
    boolean isSystem = indexName.startsWith(".");
    assert record.getDocsCount() != null;
    long docsCount = Long.parseLong(record.getDocsCount());

    String estimateSummary = indexUtils.calculateEstimateSummary(docsCount);
    String estimateTime = indexUtils.calculateEstimateTime(docsCount);
    String storageTier = indicesTierMap.get(indexName);

    return new IndexReindexInfo(
        indexName,
        record.getDocsSize(),
        String.valueOf(docsCount),
        storageTier,
        isSystem,
        estimateSummary,
        estimateTime
    );
  }

  /**
   * Safely evaluates and deletes an index, handling Data Stream write locks automatically.
   *
   * @param clusterId The ID of the cluster to execute against.
   * @param indexName The exact name of the index to delete.
   * @return true if successfully deleted, false otherwise.
   */
  public boolean safeDeleteIndex(String clusterId, String indexName) {
    log.info("Initiating safe delete process for index: [{}] on cluster: [{}]", indexName, clusterId);

    try {
      Matcher matcher = DATA_STREAM_PATTERN.matcher(indexName);

      // Phase 1: Categorize & Validate
      if (matcher.matches()) {
        String dataStreamName = matcher.group(1);
        log.debug("Identified as Data Stream backing index. Base stream name: [{}]", dataStreamName);

        if (isWriteIndex(clusterId, dataStreamName, indexName)) {
          log.info("Index [{}] is the active write index. Initiating rollover...", indexName);

          // Phase 2: Rollover (Unlock)
          boolean rolledOver = rolloverDataStream(clusterId, dataStreamName);
          if (!rolledOver) {
            log.error("Failed to rollover data stream [{}]. Aborting delete for safety.", dataStreamName);
            return false;
          }
        } else {
          log.debug("Index [{}] is an older segment. No rollover needed.", indexName);
        }
      }

      // Phase 3: Commit (Execute Delete)
      return executeDelete(clusterId, indexName);

    } catch (Exception e) {
      log.error("Elasticsearch operation failed while processing index [{}]: {}", indexName, e.getMessage(), e);
      return false;
    }
  }

  /**
   * Queries the Data Stream to check if the target index is the current write index using the custom ApiRequest.
   */
  private boolean isWriteIndex(String clusterId, String dataStreamName, String targetIndexName) {
    try {
      var client = elasticsearchClientProvider.getClient(clusterId);
      JsonNode response = client.execute(ApiRequest.builder(JsonNode.class)
          .get()
          .uri("/_data_stream/" + dataStreamName)
          .build());

      if (response == null || !response.has("data_streams") || response.get("data_streams").isEmpty()) {
        log.warn("Data stream [{}] not found or response was empty.", dataStreamName);
        return false;
      }

      JsonNode indices = response.get("data_streams").get(0).path("indices");
      if (indices.isMissingNode() || indices.isEmpty()) {
        return false;
      }

      // The last index in the backing indices array is ALWAYS the active write index
      String currentWriteIndex = indices.get(indices.size() - 1).path("index_name").asText();
      return targetIndexName.equals(currentWriteIndex);

    } catch (Exception e) {
      // Catching generic exception assuming the custom client might throw it on a 404
      log.debug("Data stream [{}] check failed (it might not exist or returned 404): {}", dataStreamName, e.getMessage());
      return false;
    }
  }

  /**
   * Forces a rollover on the specified Data Stream using the custom ApiRequest.
   */
  private boolean rolloverDataStream(String clusterId, String dataStreamName) {
    try {
      var client = elasticsearchClientProvider.getClient(clusterId);
      JsonNode response = client.execute(ApiRequest.builder(JsonNode.class)
          .post()
          .uri("/" + dataStreamName + "/_rollover")
          .build());

      if (response != null && response.path("acknowledged").asBoolean(false)) {
        log.info("Successfully rolled over data stream: [{}]", dataStreamName);
        return true;
      }
      return false;
    } catch (Exception e) {
      log.error("Exception occurred during rollover for data stream [{}]: {}", dataStreamName, e.getMessage(), e);
      return false;
    }
  }

  /**
   * Executes the actual DELETE command using the custom ApiRequest.
   */
  private boolean executeDelete(String clusterId, String indexName) {
    log.info("Executing DELETE command for index: [{}]", indexName);
    try {
      var client = elasticsearchClientProvider.getClient(clusterId);
      JsonNode response = client.execute(ApiRequest.builder(JsonNode.class)
          .delete()
          .uri("/" + indexName)
          .build());

      if (response != null && response.path("acknowledged").asBoolean(false)) {
        log.info("Successfully deleted index: [{}]", indexName);
        return true;
      } else {
        log.warn("Delete command acknowledged as false by cluster for index: [{}]", indexName);
        return false;
      }
    } catch (Exception e) {
      log.error("Exception occurred during delete for index [{}]: {}", indexName, e.getMessage(), e);
      return false;
    }
  }
}
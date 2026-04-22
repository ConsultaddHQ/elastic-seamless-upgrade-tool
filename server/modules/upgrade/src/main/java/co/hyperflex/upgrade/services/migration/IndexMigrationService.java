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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class IndexMigrationService {
  private static final Logger log = LoggerFactory.getLogger(IndexMigrationService.class);
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final ClusterUpgradeJobService clusterUpgradeJobService;
  private final IndexUtils indexUtils;

  public IndexMigrationService(ElasticsearchClientProvider elasticsearchClientProvider, ClusterUpgradeJobService clusterUpgradeJobService,
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

      // Native Jackson parsing prevents NumberFormatException
      long createdVersion = indexSettings.path("version").path("created").asLong(-1L);

      if (createdVersion != -1L && createdVersion < minAllowedVersionCode) {
        JsonNode tierNode = indexSettings.path("routing").path("allocation").path("include").path("_tier_preference");
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

}
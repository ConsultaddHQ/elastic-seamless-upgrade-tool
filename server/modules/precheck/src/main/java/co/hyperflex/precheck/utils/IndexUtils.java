package co.hyperflex.precheck.utils;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.core.constants.ElasticsearchApiPaths;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class IndexUtils {
  private static final Logger log = LoggerFactory.getLogger(IndexUtils.class);
  private static final Map<String, Integer> ES_TO_LUCENE = Map.of("5", 6, "6", 7, "7", 8, "8", 9, "9", 10);
  private static final long VERSION_MULTIPLIER = 1_000_000L;
  private static final long DOCS_HARD_THRESHOLD = 5_000_000L;
  private static final long DOCS_MEDIUM_THRESHOLD = 1_000_000L;
  private final ElasticsearchClientProvider elasticsearchClientProvider;

  public IndexUtils(ElasticsearchClientProvider elasticsearchClientProvider) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
  }

  public static int mapEsVersionToLucene(String elasticVersion) {
    String major = elasticVersion.split("\\.")[0];
    return ES_TO_LUCENE.getOrDefault(major, -1);
  }

  public boolean isLuceneCompatible(String clusterId, String indexName, int targetLucene) {
    try {
      var request = ApiRequest.builder(JsonNode.class)
          .get()
          .uri(String.format(ElasticsearchApiPaths.SEGMENTS, indexName))
          .build();
      var root = elasticsearchClientProvider.getClient(clusterId).execute(request);

      // ES supports indices created with at most one major Lucene version older => targetLucene - 1
      int minAllowed = targetLucene - 1;

      JsonNode shardsNode = root.path("indices").path(indexName).path("shards");

      for (Map.Entry<String, JsonNode> stringJsonNodeEntry : shardsNode.properties()) {
        JsonNode shardArray = stringJsonNodeEntry.getValue();

        for (JsonNode shard : shardArray) {
          JsonNode segments = shard.path("segments");

          for (Map.Entry<String, JsonNode> jsonNodeEntry : segments.properties()) {
            JsonNode segment = jsonNodeEntry.getValue();
            String versionStr = segment.path("version").asText();

            if (versionStr.isEmpty()) {
              continue;
            }

            int major = Integer.parseInt(versionStr.split("\\.")[0]);
            if (major < minAllowed) {
              log.info("Index [{}] requires reindexing (lucene={}, minAllowed={})", indexName, major, minAllowed);
              return false; // reindex required
            }
          }
        }
      }

      return true; // compatible

    } catch (Exception e) {
      log.error("Skipping index : [{}], Error Message : {} ", indexName, e.getMessage());
      return true;
    }
  }

  public String calculateEstimateTime(long docsCount) {
    if (docsCount > DOCS_HARD_THRESHOLD) {
      return "12 hours";
    }
    if (docsCount > DOCS_MEDIUM_THRESHOLD) {
      return "1 hour";
    }
    return "1 min";
  }

  public String calculateEstimateSummary(long docsCount) {
    if (docsCount > DOCS_HARD_THRESHOLD) {
      return "Hard";
    }
    if (docsCount > DOCS_MEDIUM_THRESHOLD) {
      return "Medium";
    }
    return "Easy";
  }

  public String extractStorageTier(JsonNode indexSettings) {
    JsonNode tierNode = indexSettings.path("routing").path("allocation").path("include").path("_tier_preference");

    if (tierNode.isMissingNode()) {
      return "Hot"; // Default fallback
    }

    String tierPref = tierNode.asText().toLowerCase();
    if (tierPref.contains("data_frozen")) {
      return "Frozen";
    }
    if (tierPref.contains("data_cold")) {
      return "Cold";
    }
    if (tierPref.contains("data_warm")) {
      return "Warm";
    }

    return "Hot";
  }

  public long calculateMinAllowedVersionOfElasticForIndex(String targetVersion) {
    int targetMajorVersion = Integer.parseInt(targetVersion.split("\\.")[0]);
    return (targetMajorVersion - 1) * VERSION_MULTIPLIER;
  }

}

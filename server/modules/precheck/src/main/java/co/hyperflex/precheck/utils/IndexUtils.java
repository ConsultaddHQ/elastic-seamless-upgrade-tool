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
  // Thresholds for Document Count
  private static final long DOCS_HARD_THRESHOLD = 5_000_000L;
  private static final long DOCS_MEDIUM_THRESHOLD = 1_000_000L;

  // Thresholds for Data Size (Assuming bytes)
  private static final long SIZE_HARD_THRESHOLD = 50L * 1024 * 1024 * 1024; // 50 GB
  private static final long SIZE_MEDIUM_THRESHOLD = 5L * 1024 * 1024 * 1024;  // 5 GB
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

  public String calculateEstimateTime(long docsCount, long docsSize) {
    if (docsCount > DOCS_HARD_THRESHOLD || docsSize > SIZE_HARD_THRESHOLD) {
      return "10+ hours";
    }
    if (docsCount > DOCS_MEDIUM_THRESHOLD || docsSize > SIZE_MEDIUM_THRESHOLD) {
      return "1-2 hours";
    }
    return "1-5 mins";
  }

  public String calculateEstimateSummary(long docsCount, long docsSize) {
    if (docsCount > DOCS_HARD_THRESHOLD || docsSize > SIZE_HARD_THRESHOLD) {
      return "Hard";
    }
    if (docsCount > DOCS_MEDIUM_THRESHOLD || docsSize > SIZE_MEDIUM_THRESHOLD) {
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

  /**
   * Converts Elasticsearch human-readable size strings (e.g., "11.5mb", "100b") into raw bytes.
   */
  public long parseByteSize(String sizeStr) {
    if (sizeStr == null || sizeStr.isBlank()) {
      return 0L;
    }

    String lowerStr = sizeStr.trim().toLowerCase();

    try {
      if (lowerStr.endsWith("tb")) {
        return (long) (Double.parseDouble(lowerStr.replace("tb", "").trim()) * 1024 * 1024 * 1024 * 1024);
      } else if (lowerStr.endsWith("gb")) {
        return (long) (Double.parseDouble(lowerStr.replace("gb", "").trim()) * 1024 * 1024 * 1024);
      } else if (lowerStr.endsWith("mb")) {
        return (long) (Double.parseDouble(lowerStr.replace("mb", "").trim()) * 1024 * 1024);
      } else if (lowerStr.endsWith("kb")) {
        return (long) (Double.parseDouble(lowerStr.replace("kb", "").trim()) * 1024);
      } else if (lowerStr.endsWith("b")) {
        return (long) Double.parseDouble(lowerStr.replace("b", "").trim());
      } else {
        // If no unit is found
        return (long) Double.parseDouble(lowerStr);
      }
    } catch (NumberFormatException e) {
      log.warn("Failed to parse byte size string: {}", sizeStr);
      return 0L;
    }
  }

  /**
   * Helper method to accurately check if a given name is a Data Stream.
   */
  public boolean isDataStream(String clusterId, String name) {
    try {
      var client = elasticsearchClientProvider.getClient(clusterId);

      // Ping the native Data Stream API
      JsonNode response = client.execute(ApiRequest.builder(JsonNode.class)
          .get()
          .uri("/_data_stream/" + name)
          .build());

      // If it exists and the array isn't empty, it's a Data Stream!
      return response != null && response.has("data_streams") && !response.get("data_streams").isEmpty();

    } catch (Exception e) {
      // If Elasticsearch throws a 404 Not Found (or any other error),
      // it means this is just a standard index.
      return false;
    }
  }
}

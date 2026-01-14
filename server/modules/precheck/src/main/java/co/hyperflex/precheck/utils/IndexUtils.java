package co.hyperflex.precheck.utils;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.core.constants.ElasticsearchApiPaths;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class IndexUtils {
  private static final Map<String, Integer> esToLucene = Map.of("5", 6, "6", 7, "7", 8, "8", 9, "9", 10);
  private final ElasticsearchClientProvider elasticsearchClientProvider;

  public IndexUtils(ElasticsearchClientProvider elasticsearchClientProvider) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
  }

  public static int mapEsVersionToLucene(String elasticVersion) {
    String major = elasticVersion.split("\\.")[0];
    return esToLucene.getOrDefault(major, -1);
  }

  public boolean isLuceneCompatible(String clusterId, String indexName, int targetLucene) {
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
            return false; // reindex required
          }
        }
      }
    }

    return true; // compatible
  }

}

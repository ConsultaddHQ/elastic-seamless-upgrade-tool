package co.hyperflex.precheck.concrete.index;

import co.hyperflex.common.client.ApiRequest;
import co.hyperflex.precheck.contexts.IndexContext;
import co.hyperflex.precheck.core.BaseIndexPrecheck;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class LuceneIndexCompatibilityPrecheck extends BaseIndexPrecheck {

  @Override
  public String getName() {
    return "Lucene index compatibility";
  }

  @Override
  public void run(IndexContext context) {
    var logger = context.getLogger();
    var indexName = context.getIndexName();
    var clusterUpgradeJob = context.getClusterUpgradeJob();
    int targetLucene = mapEsVersionToLucene(clusterUpgradeJob.getTargetVersion());

    var request = ApiRequest.builder(JsonNode.class).get().uri("/" + indexName + "/_segments").build();
    JsonNode root = context.getElasticClient().execute(request);
    JsonNode segmentsNode = root.path("indices").path(indexName).path("shards");

    Set<Integer> luceneVersions = new HashSet<>();

    // Iterate over shards and collect Lucene versions
    segmentsNode.properties().forEach(entry -> {
      entry.getValue().forEach(shard -> {
        JsonNode segments = shard.path("segments");
        segments.properties().forEach(segEntry -> {
          JsonNode segment = segEntry.getValue();
          String versionStr = segment.path("version").asText(); // e.g. "8.11.1"
          if (!versionStr.isEmpty()) {
            int major = Integer.parseInt(versionStr.split("\\.")[0]);
            luceneVersions.add(major);
          }
        });
      });
    });

    boolean foundUnsupportedLucene = false;
    for (Integer luceneVersion : luceneVersions) {
      if (luceneVersion < targetLucene - 1) {
        logger.error("Index [{}] contains Lucene v{} segments, too old for target Lucene v{}. Please reindex before upgrade.", indexName,
            luceneVersion, targetLucene);
        foundUnsupportedLucene = true;
      } else if (luceneVersion == targetLucene - 1) {
        logger.warn(
            "Index [{}] contains Lucene v{} segments. Target Elasticsearch [v{}] uses lucene [v{}]."
                + " Consider reindexing to avoid future issues",
            indexName,
            luceneVersion, clusterUpgradeJob.getTargetVersion(), targetLucene);
      }
    }
    if (foundUnsupportedLucene) {
      throw new RuntimeException();
    } else {
      logger.info("Index [{}] segments are compatible with target Lucene {}", indexName, targetLucene);
    }
  }

  private int mapEsVersionToLucene(String elasticVersion) {
    Map<String, Integer> esToLucene = Map.of(
        "5", 6,
        "6", 7,
        "7", 8,
        "8", 9,
        "9", 10
    );

    String major = elasticVersion.substring(0, 1);
    return esToLucene.getOrDefault(major, -1);
  }
}

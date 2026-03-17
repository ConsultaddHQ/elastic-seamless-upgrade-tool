package co.hyperflex.precheck.concrete.index;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.precheck.contexts.IndexContext;
import co.hyperflex.precheck.core.BaseIndexPrecheck;
import co.hyperflex.precheck.utils.IndexUtils;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Set;
import java.util.TreeSet;
import org.springframework.stereotype.Component;

@Component
public class LuceneIndexCompatibilityPrecheck extends BaseIndexPrecheck {

  private static final Set<String> SYSTEM_INDICES_TO_SKIP = Set.of(
      ".geoip_databases"
  );

  @Override
  public String getName() {
    return "Lucene index compatibility";
  }

  @Override
  public void run(IndexContext context) {
    var logger = context.getLogger();
    var indexName = context.getIndexName();
    var clusterUpgradeJob = context.getClusterUpgradeJob();
    int targetLucene = IndexUtils.mapEsVersionToLucene(clusterUpgradeJob.getTargetVersion());

    // Skip system indices like .geoIp_databases
    if (SYSTEM_INDICES_TO_SKIP.contains(indexName)) {
      logger.info("Skipping system index [{}] as it is managed internally by Elasticsearch.", indexName);
      return;
    }

    var request = ApiRequest.builder(JsonNode.class).get().uri("/" + indexName + "/_segments").build();
    JsonNode root = context.getElasticClient().execute(request);
    JsonNode segmentsNode = root.path("indices").path(indexName).path("shards");

    Set<Integer> luceneVersions = new TreeSet<>();

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

    //Take a minimum lucene version and validate for it only
    if (!luceneVersions.isEmpty()) {
      Integer minimumLuceneVersionOfASegment = luceneVersions.iterator().next();
      if (minimumLuceneVersionOfASegment < targetLucene - 1) {
        logger.error("Index [{}] contains Lucene v{} segments, too old for target Lucene v{}. Please reindex before upgrade.", indexName,
            minimumLuceneVersionOfASegment, targetLucene);
        foundUnsupportedLucene = true;
      } else if (minimumLuceneVersionOfASegment == targetLucene - 1) {
        logger.warn(
            "Index [{}] contains Lucene v{} segments. Target Elasticsearch [v{}] uses lucene [v{}]."
                + " Consider reindexing to avoid future issues",
            indexName,
            minimumLuceneVersionOfASegment, clusterUpgradeJob.getTargetVersion(), targetLucene);
      }
    }

    if (foundUnsupportedLucene) {
      throw new RuntimeException();
    } else {
      logger.info("Index [{}] segments are compatible with target Lucene {}", indexName, targetLucene);
    }
  }

  @Override
  public boolean skippable() {
    return false;
  }
}

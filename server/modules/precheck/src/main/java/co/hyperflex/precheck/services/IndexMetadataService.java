package co.hyperflex.precheck.services;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.springframework.stereotype.Service;

@Service
public class IndexMetadataService {
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final ClusterUpgradeJobService clusterUpgradeJobService;

  public IndexMetadataService(ElasticsearchClientProvider elasticsearchClientProvider, ClusterUpgradeJobService clusterUpgradeJobService) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
  }

  public List<IndexReindex> getReindexIndexes(String clusterId) {
    var client = elasticsearchClientProvider.getClient(clusterId);
    var indices = client.getIndices();
    return indices.stream()
        .filter(indicesRecord -> !isLuceneCompatible(clusterId, indicesRecord.getIndex()))
        .map(indicesRecord -> new IndexReindex(
            indicesRecord.getIndex(),
            indicesRecord.getDocsSize(),
            indicesRecord.getDocsCount()
        )).toList();
  }

  public boolean isLuceneCompatible(String clusterId, String indexName) {
    var request = ApiRequest.builder(JsonNode.class).get().uri("/" + indexName + "/_segments").build();
    var root = elasticsearchClientProvider.getClient(clusterId).execute(request);
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    int targetLucene = mapEsVersionToLucene(upgradeJob.getTargetVersion());

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

    //Take minimum lucene version and validate for it only
    if (!luceneVersions.isEmpty()) {
      Integer minimumLuceneVersionOfASegment = luceneVersions.iterator().next();
      return minimumLuceneVersionOfASegment >= targetLucene - 1;
    }
    return true;
  }

  record IndexReindex(String index, String size, String docsCount) {

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

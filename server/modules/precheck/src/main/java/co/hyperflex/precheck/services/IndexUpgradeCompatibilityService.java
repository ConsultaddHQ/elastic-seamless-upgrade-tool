package co.hyperflex.precheck.services;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.precheck.services.dtos.IndexReindexInfo;
import co.hyperflex.precheck.utils.IndexUtils;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Service;

@Service
public class IndexUpgradeCompatibilityService {

  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final ClusterUpgradeJobService clusterUpgradeJobService;

  public IndexUpgradeCompatibilityService(ElasticsearchClientProvider elasticsearchClientProvider,
                                          ClusterUpgradeJobService clusterUpgradeJobService) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
  }

  public List<IndexReindexInfo> getReindexIndexesMetadata(String clusterId) {
    var client = elasticsearchClientProvider.getClient(clusterId);
    var indices = client.getIndices();
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    int targetLucene = IndexUtils.mapEsVersionToLucene(upgradeJob.getTargetVersion());

    return indices.stream()
        .filter(indicesRecord -> !isLuceneCompatible(clusterId, indicesRecord.getIndex(), targetLucene))
        .map(indicesRecord -> new IndexReindexInfo(
            indicesRecord.getIndex(),
            indicesRecord.getDocsSize(),
            indicesRecord.getDocsCount()
        )).toList();
  }

  public boolean isLuceneCompatible(String clusterId, String indexName, int targetLucene) {
    var request = ApiRequest.builder(JsonNode.class).get().uri("/" + indexName + "/_segments").build();
    var root = elasticsearchClientProvider.getClient(clusterId).execute(request);
    AtomicInteger minLuceneVersion = new AtomicInteger(Integer.MAX_VALUE);

    JsonNode segmentsNode = root.path("indices").path(indexName).path("shards");

    // Iterate over shards and find min Lucene version
    segmentsNode.properties().forEach(entry -> {
      entry.getValue().forEach(shard -> {
        JsonNode segments = shard.path("segments");
        segments.properties().forEach(segEntry -> {
          JsonNode segment = segEntry.getValue();
          String versionStr = segment.path("version").asText(); // e.g. "8.11.1"
          if (!versionStr.isEmpty()) {
            int major = Integer.parseInt(versionStr.split("\\.")[0]);
            minLuceneVersion.set(Math.min(minLuceneVersion.get(), major));
          }
        });
      });
    });

    //validate minimum lucene version
    // ES supports indices created with at most one major Lucene version older => targetLucene - 1
    return minLuceneVersion.get() == Integer.MAX_VALUE || minLuceneVersion.get() >= targetLucene - 1;
  }

}

package co.hyperflex.upgrade.services.migration;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.utils.VersionUtils;
import co.hyperflex.upgrade.services.dtos.IndexReindexInfo;
import co.hyperflex.precheck.utils.IndexUtils;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class IndexMigrationService {

  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final ClusterUpgradeJobService clusterUpgradeJobService;
  private final IndexUtils indexUtils;

  public IndexMigrationService(ElasticsearchClientProvider elasticsearchClientProvider,
                               ClusterUpgradeJobService clusterUpgradeJobService, IndexUtils indexUtils) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
    this.indexUtils = indexUtils;
  }

  public List<IndexReindexInfo> getReindexIndexesMetadata(String clusterId) {
    var client = elasticsearchClientProvider.getClient(clusterId);
    var indices = client.getIndices();
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    int targetLucene = IndexUtils.mapEsVersionToLucene(upgradeJob.getTargetVersion());

    return indices.stream()
        .filter(indicesRecord -> !indexUtils.isLuceneCompatible(clusterId, indicesRecord.getIndex(), targetLucene))
        .map(indicesRecord -> new IndexReindexInfo(
            indicesRecord.getIndex(),
            indicesRecord.getDocsSize(),
            indicesRecord.getDocsCount()
        )).toList();
  }

  public IndexMigrationResponse migrate(String clusterId) {
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    if (VersionUtils.isVersionGte(upgradeJob.getCurrentVersion(), "8.18.0")) {
      var client = elasticsearchClientProvider.getClient(clusterId);
      client.execute(ApiRequest.builder(JsonNode.class).post().uri("\n" +
          "/_migration/reindex").build());
    }
    return new IndexMigrationResponse();
  }


}
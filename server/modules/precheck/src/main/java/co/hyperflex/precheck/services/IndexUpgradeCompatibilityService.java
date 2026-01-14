package co.hyperflex.precheck.services;

import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.precheck.services.dtos.IndexReindexInfo;
import co.hyperflex.precheck.utils.IndexUtils;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class IndexUpgradeCompatibilityService {

  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final ClusterUpgradeJobService clusterUpgradeJobService;
  private final IndexUtils indexUtils;

  public IndexUpgradeCompatibilityService(ElasticsearchClientProvider elasticsearchClientProvider,
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

}

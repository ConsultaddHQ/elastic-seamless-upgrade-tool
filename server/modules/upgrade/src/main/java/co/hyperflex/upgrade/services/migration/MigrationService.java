package co.hyperflex.upgrade.services.migration;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.utils.VersionUtils;
import co.hyperflex.precheck.utils.IndexUtils;
import co.hyperflex.upgrade.services.dtos.IndexReindexInfo;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class MigrationService {

  private static final Logger log = LoggerFactory.getLogger(MigrationService.class);
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final ClusterUpgradeJobService clusterUpgradeJobService;
  private final IndexUtils indexUtils;

  public MigrationService(ElasticsearchClientProvider elasticsearchClientProvider, ClusterUpgradeJobService clusterUpgradeJobService,
                          IndexUtils indexUtils) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
    this.indexUtils = indexUtils;
  }

  public Map<String, Object> getMigrationInfo(String clusterId) {
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    Boolean isValidUpgradePath = VersionUtils.isValidUpgrade(upgradeJob.getCurrentVersion(), upgradeJob.getTargetVersion());

    List<IndexReindexInfo> reindexNeedingIndices = getReindexIndexesMetadata(clusterId);

    boolean isReindexPossible = true;
    String reason = null;

    if (!reindexNeedingIndices.isEmpty()) {
      if (!isValidUpgradePath) {
        reason = "Currently you are in view only mode, Select Target version with valid upgrade path";
        isReindexPossible = false;
      } else if (!VersionUtils.isVersionGte(upgradeJob.getCurrentVersion(), "8.18.0")) {
        reason = "Directly Reindexing Legacy backing indices is generally available from version 8.18.0, You have to reindex them manually";
        isReindexPossible = false;
      } else if (!getFeatureMigrationResponse(clusterId).status().equals(FeatureMigrationStatus.NO_MIGRATION_NEEDED)) {
        reason = "First Migrate Features";
        isReindexPossible = false;
      }
    } else {
      isReindexPossible = false;
    }

    Map<String, Object> reindexObj = new java.util.HashMap<>();
    reindexObj.put("possible", isReindexPossible);
    reindexObj.put("reason", reason); // can be null

    Map<String, Object> resp = new java.util.HashMap<>();
    resp.put("systemIndices", getFeatureMigrationResponse(clusterId));
    resp.put("customIndices", reindexNeedingIndices);
    resp.put("reindex", reindexObj);
    resp.put("isValidUpgradePath", isValidUpgradePath);

    return resp;
  }


  public FeatureMigrationResponse migrate(String clusterId) {
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    if (VersionUtils.isVersionGte(upgradeJob.getCurrentVersion(), "7.16.0")) {
      var client = elasticsearchClientProvider.getClient(clusterId);
      client.execute(ApiRequest.builder(JsonNode.class).post().uri("/_migration/system_features").build());
    }
    return new FeatureMigrationResponse();
  }


  public List<IndexReindexInfo> getReindexIndexesMetadata(String clusterId) {
    var client = elasticsearchClientProvider.getClient(clusterId);
    var indices = client.getIndices();
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    int targetLucene = IndexUtils.mapEsVersionToLucene(upgradeJob.getTargetVersion());

    return indices.stream().filter(indicesRecord -> !indexUtils.isLuceneCompatible(clusterId, indicesRecord.getIndex(), targetLucene))
        .map(indicesRecord -> new IndexReindexInfo(indicesRecord.getIndex(), indicesRecord.getDocsSize(), indicesRecord.getDocsCount()))
        .toList();
  }


  public @NotNull GetFeatureMigrationResponse getFeatureMigrationResponse(String clusterId) {
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    if (VersionUtils.isVersionGte(upgradeJob.getCurrentVersion(), "7.16.0")) {
      var client = elasticsearchClientProvider.getClient(clusterId);
      var response = client.execute(ApiRequest.builder(JsonNode.class).get().uri("/_migration/system_features").build());
      var migrationStatus = response.get("migration_status").asText();
      return new GetFeatureMigrationResponse(FeatureMigrationStatus.valueOf(migrationStatus));
    } else {
      // This was generally available; Added in 7.16.0
      return new GetFeatureMigrationResponse(FeatureMigrationStatus.NO_MIGRATION_NEEDED);
    }
  }

  public IndexMigrationResponse reindexIndices(String clusterId) {
    var upgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    if (VersionUtils.isVersionGte(upgradeJob.getCurrentVersion(), "8.18.0")) {
      var client = elasticsearchClientProvider.getClient(clusterId);
      client.execute(ApiRequest.builder(JsonNode.class).post().uri("\n" + "/_migration/reindex").build());
    }
    return new IndexMigrationResponse();
  }
}

package co.hyperflex.clients.elastic;

import co.hyperflex.clients.client.ApiClient;
import co.hyperflex.clients.elastic.dto.GetAllocationExplanationResponse;
import co.hyperflex.clients.elastic.dto.GetElasticDeprecationResponse;
import co.hyperflex.clients.elastic.dto.GetElasticNodeAndIndexCountsResponse;
import co.hyperflex.clients.elastic.dto.GetElasticsearchSnapshotResponse;
import co.hyperflex.clients.elastic.dto.cat.health.HealthRecord;
import co.hyperflex.clients.elastic.dto.cat.indices.FlushResponse;
import co.hyperflex.clients.elastic.dto.cat.indices.IndicesRecord;
import co.hyperflex.clients.elastic.dto.cat.master.MasterRecord;
import co.hyperflex.clients.elastic.dto.cat.shards.ShardsRecord;
import co.hyperflex.clients.elastic.dto.cluster.AllocationExplainRequest;
import co.hyperflex.clients.elastic.dto.cluster.AllocationExplainResponse;
import co.hyperflex.clients.elastic.dto.cluster.ClusterStatsResponse;
import co.hyperflex.clients.elastic.dto.cluster.GetClusterSettingsResponse;
import co.hyperflex.clients.elastic.dto.cluster.PutClusterSettingsResponse;
import co.hyperflex.clients.elastic.dto.cluster.health.ClusterHealthResponse;
import co.hyperflex.clients.elastic.dto.nodes.NodesInfoResponse;
import co.hyperflex.clients.elastic.dto.nodes.NodesStatsResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public interface ElasticClient extends ApiClient {

  List<HealthRecord> getHealth();

  List<IndicesRecord> getIndices();

  String getHealthStatus();

  List<MasterRecord> getActiveMasters();

  Boolean isAdaptiveReplicaEnabled() throws IOException;

  List<GetElasticsearchSnapshotResponse> getValidSnapshots(String version);

  GetElasticNodeAndIndexCountsResponse getEntitiesCounts();

  GetElasticDeprecationResponse getDeprecation();

  List<GetAllocationExplanationResponse> getAllocationExplanation();

  AllocationExplainResponse getAllocationExplanation(AllocationExplainRequest request);

  GetClusterSettingsResponse getClusterSettings();

  PutClusterSettingsResponse updateClusterSettings(Map<String, Object> clusterSettings);

  List<ShardsRecord> getShards();

  List<ShardsRecord> getShards(String indexName);

  FlushResponse flushIndices();

  ClusterHealthResponse getClusterHealth();

  co.hyperflex.clients.elastic.dto.info.InfoResponse getInfo();

  NodesInfoResponse getNodesInfo();

  NodesInfoResponse getNodeInfo(String nodeId);

  NodesStatsResponse getNodesMetric(String nodeId);

  NodesStatsResponse getNodesMetric(String nodeId, String metric);

  ClusterStatsResponse getClusterStats();
}

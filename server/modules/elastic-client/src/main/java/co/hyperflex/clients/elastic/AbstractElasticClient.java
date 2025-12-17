package co.hyperflex.clients.elastic;

import co.hyperflex.clients.client.ApiClient;
import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.clients.elastic.dto.GetElasticDeprecationResponse;
import co.hyperflex.clients.elastic.dto.GetElasticNodeAndIndexCountsResponse;
import co.hyperflex.clients.elastic.dto.cat.indices.FlushResponse;
import co.hyperflex.clients.elastic.dto.cat.shards.ShardsRecord;
import co.hyperflex.clients.elastic.dto.cluster.AllocationExplainRequest;
import co.hyperflex.clients.elastic.dto.cluster.AllocationExplainResponse;
import co.hyperflex.clients.elastic.dto.cluster.ClusterStatsResponse;
import co.hyperflex.clients.elastic.dto.cluster.GetClusterSettingsResponse;
import co.hyperflex.clients.elastic.dto.cluster.PutClusterSettingsResponse;
import co.hyperflex.clients.elastic.dto.cluster.health.ClusterHealthResponse;
import co.hyperflex.clients.elastic.dto.info.InfoResponse;
import co.hyperflex.clients.elastic.dto.nodes.NodesInfoResponse;
import co.hyperflex.clients.elastic.dto.nodes.NodesStatsResponse;
import java.util.List;
import java.util.Map;


public abstract class AbstractElasticClient implements ElasticClient {
  private final ApiClient apiClient;

  protected AbstractElasticClient(ApiClient apiClient) {
    this.apiClient = apiClient;
  }

  @Override
  public String getHealthStatus() {
    return getHealth().get(0).getStatus();
  }


  @Override
  public Boolean isAdaptiveReplicaEnabled() {
    GetClusterSettingsResponse settings = getClusterSettings();

    Map<String, Object> transientSettings = settings.getTransient();
    Map<String, Object> persistentSettings = settings.getPersistent();
    Map<String, Object> defaultSettings = settings.getDefaults();

    String value = null;

    if (transientSettings.containsKey("search.adaptive_replica_selection")) {
      value = transientSettings.get("search.adaptive_replica_selection").toString();
    } else if (persistentSettings.containsKey("search.adaptive_replica_selection")) {
      value = persistentSettings.get("search.adaptive_replica_selection").toString();
    } else if (defaultSettings.containsKey("search.adaptive_replica_selection")) {
      value = defaultSettings.get("search.adaptive_replica_selection").toString();
    }
    return Boolean.parseBoolean(value);
  }

  @Override
  public GetElasticNodeAndIndexCountsResponse getEntitiesCounts() {
    ClusterHealthResponse health = getClusterHealth();
    int totalIndices = getIndices().size();
    int activePrimaryShards = health.getActivePrimaryShards();
    int activeShards = health.getActiveShards();
    int unassignedShards = health.getUnassignedShards();
    int initializingShards = health.getInitializingShards();
    int relocatingShards = health.getRelocatingShards();
    var stats = getClusterStats();
    var nodeCount = stats.getNodes().getCount();
    int totalNodes = nodeCount.getTotal();
    int dataNodes = nodeCount.getData()
        + nodeCount.getDataCold()
        + nodeCount.getDataContent()
        + nodeCount.getDataHot()
        + nodeCount.getDataWarm();
    int masterNodes = nodeCount.getMaster();

    return new GetElasticNodeAndIndexCountsResponse(dataNodes, totalNodes, masterNodes,
        totalIndices, activePrimaryShards, activeShards, unassignedShards, initializingShards,
        relocatingShards);
  }


  @Override
  public AllocationExplainResponse getAllocationExplanation(AllocationExplainRequest request) {
    Map<String, Object> requestBody = Map.of(
        "index", request.index(),
        "shard", request.shard(),
        "primary", request.primary()
    );
    var uri = "/_cluster/allocation/explain";

    var apiRequest = ApiRequest.builder(AllocationExplainResponse.class).post()
        .body(requestBody)
        .uri(uri).build();
    return execute(apiRequest);
  }

  @Override
  public GetElasticDeprecationResponse getDeprecation() {
    var uri = "/_migration/deprecations";
    return execute(ApiRequest.builder(GetElasticDeprecationResponse.class).get().uri(uri).build());
  }

  @Override
  public GetClusterSettingsResponse getClusterSettings() {
    String uri = "/_cluster/settings?flat_settings=true&include_defaults=false&format=json";
    return execute(ApiRequest.builder(GetClusterSettingsResponse.class).uri(uri).get().build());
  }

  @Override
  public List<ShardsRecord> getShards() {
    return getShards("");
  }


  @Override
  public FlushResponse flushIndices() {
    var request = ApiRequest.builder(FlushResponse.class).post().uri("/_flush").build();
    return execute(request);
  }

  @Override
  public ClusterHealthResponse getClusterHealth() {
    var uri = "/_cluster/health";
    var request = ApiRequest.builder(ClusterHealthResponse.class).get().uri(uri).build();
    return execute(request);
  }

  @Override
  public InfoResponse getInfo() {
    var request = ApiRequest.builder(InfoResponse.class).get().uri("/").build();
    return execute(request);
  }

  @Override
  public NodesInfoResponse getNodeInfo(String nodeId) {
    String uri = "/_nodes/" + nodeId;
    var request = ApiRequest.builder(NodesInfoResponse.class).get().uri(uri).build();
    return execute(request);
  }

  @Override
  public NodesInfoResponse getNodesInfo() {
    return getNodeInfo("");
  }

  @Override
  public ClusterStatsResponse getClusterStats() {
    var uri = "/_cluster/stats?format=json";
    var request = ApiRequest.builder(ClusterStatsResponse.class).get().uri(uri).build();
    return execute(request);
  }

  @Override
  public NodesStatsResponse getNodesMetric(String nodeId) {
    return getNodesMetric(nodeId, "stats");
  }

  @Override
  public NodesStatsResponse getNodesMetric(String nodeId, String metric) {
    String uri = "/_nodes/" + nodeId + "/" + metric;
    var request = ApiRequest.builder(NodesStatsResponse.class).get().uri(uri).build();
    return execute(request);
  }


  @Override
  public PutClusterSettingsResponse updateClusterSettings(Map<String, Object> clusterSettings) {
    String uri = "/_cluster/settings?format=json";
    return execute(ApiRequest.builder(PutClusterSettingsResponse.class).put().body(clusterSettings).uri(uri).build());
  }


  @Override
  public <T> T execute(ApiRequest<T> request) {
    return apiClient.execute(request);
  }
}


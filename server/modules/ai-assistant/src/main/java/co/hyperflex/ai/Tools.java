package co.hyperflex.ai;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.core.services.clusters.ClusterService;
import co.hyperflex.core.services.clusters.dtos.GetClusterNodeResponse;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class Tools {
  private final Logger log = LoggerFactory.getLogger(getClass());
  private final ClusterUpgradeJobService clusterUpgradeJobService;
  private final ClusterService clusterService;
  private final ElasticsearchClientProvider elasticsearchClientProvider;

  public Tools(ClusterUpgradeJobService clusterUpgradeJobService, ClusterService clusterService,
               ElasticsearchClientProvider elasticsearchClientProvider) {
    this.clusterUpgradeJobService = clusterUpgradeJobService;
    this.clusterService = clusterService;
    this.elasticsearchClientProvider = elasticsearchClientProvider;
  }

  @Tool("Get the current and target Elasticsearch versions for the upgrade job")
  public ClusterUpgradeJobEntity getUpgradeJobInfo() {
    log.info("[Tool call] Get the current and target Elasticsearch versions for the upgrade job");
    var clusterId = SessionContextHolder.getSessionContext().clusterId();
    return clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
  }

  @Tool("Get all elastic and kibana nodes of elastic cluster")
  public List<GetClusterNodeResponse> getNodes() {
    log.info("[Tool call] Get all elastic and kibana nodes of elastic cluster");
    var clusterId = SessionContextHolder.getSessionContext().clusterId();
    return clusterService.getNodes(clusterId);
  }

  @Tool("""
      Perform a GET request on the connected Elasticsearch cluster by providing a relative API endpoint path.
      Returns the raw JSON or text response from Elasticsearch.
      """)
  public String performGetOnElastic(@P("Endpoint path (e.g., /_cluster/health,/_cat/indices)") String relativePath) {
    log.info("[Tool call] Perform GET request on Elasticsearch cluster using relative path {}", relativePath);
    var clusterId = SessionContextHolder.getSessionContext().clusterId();
    var client = elasticsearchClientProvider.getClient(clusterId);
    return client.execute(ApiRequest.builder(String.class).get().uri(relativePath).build());
  }

  @Tool("""
      Send an HTTP GET request to the specified URL (http/https) and return the response body as plain text.
      Useful for fetching JSON, HTML, or other text-based content from external services or APIs.
      If the request fails, an error message string is returned.
      """)
  public String httpGet(@P("Url") String url) {
    log.info("[Tool call] Perform GET request for the provided URL {}", url);
    try (var client = HttpClient.newHttpClient()) {
      var request = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
      var response = client.send(request, HttpResponse.BodyHandlers.ofString());
      return response.body();
    } catch (Exception e) {
      return "Error fetching URL: " + e.getMessage();
    }
  }
}

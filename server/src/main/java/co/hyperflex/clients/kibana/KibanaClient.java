package co.hyperflex.clients.kibana;

import co.hyperflex.clients.kibana.dto.GetKibanaDeprecationResponse;
import co.hyperflex.clients.kibana.dto.GetKibanaStatusResponse;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

public class KibanaClient {

  private static final Logger logger = LoggerFactory.getLogger(KibanaClient.class);
  private final RestClient restClient;
  private final String kibanaUrl;

  public KibanaClient(RestClient restClient, String kibanaUrl) {
    this.restClient = restClient;
    this.kibanaUrl = kibanaUrl;
  }

  public boolean isKibanaReady(String host) {
    String url = "http://" + host + ":5601/api/kibana/settings";
    try {
      restClient.get().uri(url).retrieve().toBodilessEntity();
      return true;
    } catch (Exception e) {
      logger.error("Failed to check if kibana is ready on host {}", host, e);
      return false;
    }
  }

  public String getKibanaVersion(String nodeIp) {
    return getKibanaNodeDetails(nodeIp).version().number();
  }

  public String getKibanaVersion() {
    return getKibanaNodeDetails(null).version().number();
  }

  public GetKibanaStatusResponse getKibanaNodeDetails(String nodeIp) {
    String url =
        Optional.ofNullable(nodeIp).map(ip -> String.format("http://%s:5601/api/status", ip))
            .orElse(kibanaUrl + "/api/status");
    try {
      return restClient.get().uri(url).retrieve().body(GetKibanaStatusResponse.class);
    } catch (RestClientException e) {
      logger.error("Error getting Kibana node details: {}", e.getMessage());
      throw e;
    }
  }

  public GetKibanaDeprecationResponse getDeprecations() {
    String url = kibanaUrl + "/api/deprecations/";
    try {
      return restClient.get().uri(url).retrieve().body(GetKibanaDeprecationResponse.class);
    } catch (RestClientException e) {
      logger.error("Error getting Kibana deprecations: {}", e.getMessage());
      throw e;
    }
  }

  public String getSnapshotCreationPageUrl() {
    return kibanaUrl + "/app/management/data/snapshot_restore/snapshots";
  }

  public RestClient getRestClient() {
    return restClient;
  }
}

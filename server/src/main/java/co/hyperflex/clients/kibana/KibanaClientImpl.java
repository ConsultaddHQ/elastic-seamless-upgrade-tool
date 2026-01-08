package co.hyperflex.clients.kibana;

import co.hyperflex.clients.RestApiClient;
import co.hyperflex.clients.kibana.dto.GetKibanaDeprecationResponse;
import co.hyperflex.clients.kibana.dto.GetKibanaStatusResponse;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

public class KibanaClientImpl extends RestApiClient implements co.hyperflex.clients.kibana.KibanaClient {

  private static final Logger logger = LoggerFactory.getLogger(KibanaClientImpl.class);
  private final String kibanaUrl;
  private final String protocol;

  public KibanaClientImpl(RestClient restClient, String kibanaUrl) {
    super(restClient);
    this.kibanaUrl = kibanaUrl;
    this.protocol = kibanaUrl.startsWith("https://") ? "https://" : "http://";
  }

  @Override
  public String baseUrl(String hostIp) {
    return this.protocol + hostIp + ":5601";
  }

  @Override
  public boolean isKibanaReady(String host) {
    String url = protocol + host + ":5601/api/status";
    try {
      restClient.get().uri(url).retrieve().toBodilessEntity();
      return true;
    } catch (Exception e) {
      logger.error("Failed to check if kibana is ready on host {}", host, e);
      return false;
    }
  }

  @Override
  public String getKibanaVersion(String nodeIp) {
    return getKibanaNodeDetails(nodeIp).version().number();
  }

  @Override
  public String getKibanaVersion() {
    return getKibanaNodeDetails(null).version().number();
  }

  @Override
  public GetKibanaStatusResponse getKibanaNodeDetails(String nodeIp) {
    String url =
        Optional.ofNullable(nodeIp).map(ip -> String.format(protocol + "%s:5601/api/status", ip))
            .orElse(kibanaUrl + "/api/status");
    try {
      return restClient.get().uri(url).retrieve().body(GetKibanaStatusResponse.class);
    } catch (RestClientException e) {
      logger.error("Error getting Kibana node details: {}", e.getMessage());
      throw e;
    }
  }

  @Override
  public GetKibanaDeprecationResponse getDeprecations() {
    String url = kibanaUrl + "/api/deprecations/";
    try {
      return restClient.get().uri(url).retrieve().body(GetKibanaDeprecationResponse.class);
    } catch (RestClientException e) {
      logger.error("Error getting Kibana deprecations: {}", e.getMessage());
      throw e;
    }
  }

  @Override
  public String getSnapshotCreationPageUrl() {
    return kibanaUrl + "/app/management/data/snapshot_restore/snapshots";
  }
}

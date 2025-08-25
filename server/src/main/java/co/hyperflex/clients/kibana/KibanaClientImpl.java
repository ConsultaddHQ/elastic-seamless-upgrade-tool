package co.hyperflex.clients.kibana;

import co.hyperflex.clients.kibana.dto.GetKibanaDeprecationResponse;
import co.hyperflex.clients.kibana.dto.GetKibanaStatusResponse;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

public class KibanaClientImpl implements KibanaClient {

  private static final Logger logger = LoggerFactory.getLogger(KibanaClientImpl.class);
  private final RestClient restClient;
  private final String kibanaUrl;

  public KibanaClientImpl(RestClient restClient, String kibanaUrl) {
    this.restClient = restClient;
    this.kibanaUrl = kibanaUrl;
  }

  @Override
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
        Optional.ofNullable(nodeIp).map(ip -> String.format("http://%s:5601/api/status", ip))
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

  @Override
  public <T> T execute(KibanaRequest<T> request) {
    Consumer<HttpHeaders> httpHeadersConsumer = httpHeaders -> {
      Map<String, Object> headers = request.getHeaders();
      if (headers != null) {
        headers.forEach((name, value) -> httpHeaders.add(name, String.valueOf(value)));
      }
    };
    ResponseEntity<T> response = switch (request.getMethod()) {
      case GET -> restClient.get()
          .uri(request.getUri())
          .headers(httpHeadersConsumer)
          .retrieve()
          .toEntity(request.getResponseType());

      case POST -> restClient.post()
          .uri(request.getUri())
          .headers(httpHeadersConsumer)
          .body(request.getBody())
          .retrieve()
          .toEntity(request.getResponseType());

      case PUT -> restClient.put()
          .uri(request.getUri())
          .headers(httpHeadersConsumer)
          .body(request.getBody())
          .retrieve()
          .toEntity(request.getResponseType());

      case DELETE -> restClient.delete()
          .uri(request.getUri())
          .headers(httpHeadersConsumer)
          .retrieve()
          .toEntity(request.getResponseType());
    };

    return response.getBody();
  }
}

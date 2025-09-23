package co.hyperflex.clients;

import co.hyperflex.common.client.ApiClient;
import co.hyperflex.common.client.ApiRequest;
import java.util.Map;
import java.util.function.Consumer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;

public class RestApiClient implements ApiClient {
  protected final RestClient restClient;

  public RestApiClient(RestClient restClient) {
    this.restClient = restClient;
  }

  @Override
  public <T> T execute(ApiRequest<T> request) {
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

      case POST -> {
        var builder = restClient.post()
            .uri(request.getUri())
            .headers(httpHeadersConsumer);
        if (request.getBody() != null) {
          builder = builder.body(request.getBody());
        }
        yield builder.retrieve().toEntity(request.getResponseType());
      }

      case PUT -> {
        var builder = restClient.put()
            .uri(request.getUri())
            .headers(httpHeadersConsumer);
        if (request.getBody() != null) {
          builder = builder.body(request.getBody());
        }
        yield builder.retrieve().toEntity(request.getResponseType());
      }

      case DELETE -> restClient.delete()
          .uri(request.getUri())
          .headers(httpHeadersConsumer)
          .retrieve()
          .toEntity(request.getResponseType());
    };

    return response.getBody();
  }

  public RestClient getRestClient() {
    return restClient;
  }
}

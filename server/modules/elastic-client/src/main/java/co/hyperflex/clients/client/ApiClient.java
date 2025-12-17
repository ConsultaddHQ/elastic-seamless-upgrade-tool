package co.hyperflex.clients.client;

public interface ApiClient {
  <T> T execute(ApiRequest<T> request);
}

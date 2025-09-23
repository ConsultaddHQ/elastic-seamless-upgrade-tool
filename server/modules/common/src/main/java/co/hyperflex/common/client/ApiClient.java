package co.hyperflex.common.client;

public interface ApiClient {
  <T> T execute(ApiRequest<T> request);
}

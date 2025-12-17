package co.hyperflex.clients.client;

import java.util.HashMap;
import java.util.Map;

public class ApiRequest<T> {
  private final String uri;
  private final Object body;
  private final Class<T> responseType;
  private final HttpMethod method;
  private final Map<String, Object> headers;

  private ApiRequest(Builder<T> builder) {
    this.uri = builder.uri;
    this.body = builder.body;
    this.responseType = builder.responseType;
    this.method = builder.method;
    this.headers = builder.headers;
  }

  public static Object builder(HttpMethod method) {
    return builder(Object.class);
  }

  public static <T> Builder<T> builder(Class<T> responseType) {
    return new Builder<>(responseType);
  }

  public String getUri() {
    return uri;
  }

  public Object getBody() {
    return body;
  }

  public Class<T> getResponseType() {
    return responseType;
  }

  public HttpMethod getMethod() {
    return method;
  }

  public Map<String, Object> getHeaders() {
    return headers;
  }

  public static class Builder<T> {
    private final Class<T> responseType;
    private String uri;
    private Object body;
    private HttpMethod method;
    private Map<String, Object> headers;

    public Builder(Class<T> responseType) {
      this.responseType = responseType;
    }

    public Builder<T> uri(String uri) {
      this.uri = uri;
      return this;
    }

    public Builder<T> body(Object body) {
      this.body = body;
      return this;
    }

    public Builder<T> header(Map<String, Object> headers) {
      this.headers = headers;
      return this;
    }

    public Builder<T> addHeader(String name, Object value) {
      if (headers == null) {
        headers = new HashMap<>();
      }
      headers.put(name, value);
      return this;
    }

    public Builder<T> get() {
      this.method = HttpMethod.GET;
      return this;
    }

    public Builder<T> post() {
      this.method = HttpMethod.POST;
      return this;
    }

    public Builder<T> put() {
      this.method = HttpMethod.PUT;
      return this;
    }

    public Builder<T> delete() {
      this.method = HttpMethod.DELETE;
      return this;
    }


    public ApiRequest<T> build() {
      if (uri == null || method == null) {
        throw new IllegalStateException("uri and method are required");
      }
      return new ApiRequest<>(this);
    }
  }
}

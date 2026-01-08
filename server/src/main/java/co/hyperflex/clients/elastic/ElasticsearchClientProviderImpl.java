package co.hyperflex.clients.elastic;

import co.hyperflex.clients.RestApiClient;
import co.hyperflex.clients.client.ClientConnectionDetail;
import co.hyperflex.clients.client.ClientConnectionDetailProvider;
import co.hyperflex.core.exceptions.NotFoundException;
import co.hyperflex.core.repositories.ClusterRepository;
import co.hyperflex.core.services.secret.SecretStoreService;
import co.hyperflex.core.utils.ClusterAuthUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotNull;
import java.net.Socket;
import java.net.http.HttpClient;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLEngine;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509ExtendedTrustManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;


@Component
public class ElasticsearchClientProviderImpl implements ElasticsearchClientProvider, ClientConnectionDetailProvider {

  private final Logger logger = LoggerFactory.getLogger(ElasticsearchClientProviderImpl.class);
  private final ClusterRepository clusterRepository;
  private final SecretStoreService secretStoreService;
  private final ObjectMapper objectMapper;

  public ElasticsearchClientProviderImpl(ClusterRepository clusterRepository, SecretStoreService secretStoreService,
                                         ObjectMapper objectMapper) {
    this.clusterRepository = clusterRepository;
    this.secretStoreService = secretStoreService;
    this.objectMapper = objectMapper;
  }

  @Cacheable(value = "elasticClientCache", key = "#p0")
  @Override
  public ElasticClient getClient(@NotNull String clusterId) {
    return clusterRepository.findById(clusterId).map(ClusterAuthUtils::getElasticConnectionDetail)
        .map(this::getClient)
        .orElseThrow(() -> new NotFoundException("Cluster not found"));
  }

  @Override
  public ElasticClient getClient(ClientConnectionDetail detail) {
    try {
      HttpClient jdkHttpClient = HttpClient.newBuilder()
          .sslContext(getSSLContext())
          .build();

      RestClient genericClient = RestClient.builder()
          .baseUrl(detail.baseUrl())
          .defaultHeader("Authorization", secretStoreService.getSecret(detail.secretKey()).value())
          .defaultHeader("Content-Type", "application/json")
          .requestFactory(new JdkClientHttpRequestFactory(jdkHttpClient))
          .build();

      return new ElasticClientImpl(new RestApiClient(genericClient), objectMapper);
    } catch (Exception e) {
      logger.error("Failed to create elasticsearch client", e);
      throw new RuntimeException(e);
    }
  }

  private SSLContext getSSLContext() throws NoSuchAlgorithmException, KeyManagementException {
    var trustManager = new X509ExtendedTrustManager() {
      @Override
      public X509Certificate[] getAcceptedIssuers() {
        return new X509Certificate[] {};
      }

      @Override
      public void checkClientTrusted(X509Certificate[] chain, String authType) {
      }

      @Override
      public void checkClientTrusted(X509Certificate[] chain, String authType, SSLEngine engine) {
      }

      @Override
      public void checkClientTrusted(X509Certificate[] chain, String authType, Socket socket) {
      }

      @Override
      public void checkServerTrusted(X509Certificate[] chain, String authType) {
      }


      @Override
      public void checkServerTrusted(X509Certificate[] chain, String authType, Socket socket) {
      }


      @Override
      public void checkServerTrusted(X509Certificate[] chain, String authType, SSLEngine engine) {
      }
    };
    var sslContext = SSLContext.getInstance("TLS");
    sslContext.init(null, new TrustManager[] {trustManager}, new SecureRandom());
    return sslContext;
  }

  @Override
  public ClientConnectionDetail getDetail(String clusterId) {
    return clusterRepository.findById(clusterId).map(ClusterAuthUtils::getElasticConnectionDetail)
        .orElseThrow(() -> new NotFoundException("Cluster not found"));
  }

}

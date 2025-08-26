package co.hyperflex.clients.elastic;

import co.hyperflex.common.client.ClientConnectionDetail;
import co.hyperflex.common.client.ClientConnectionDetailProvider;
import co.hyperflex.common.exceptions.NotFoundException;
import co.hyperflex.core.repositories.ClusterRepository;
import co.hyperflex.core.utils.ClusterAuthUtils;
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

  public ElasticsearchClientProviderImpl(ClusterRepository clusterRepository) {
    this.clusterRepository = clusterRepository;
  }

  @Cacheable(value = "elasticClientCache", key = "#clusterId")
  @Override
  public ElasticClient getClient(@NotNull String clusterId) {
    return clusterRepository.findById(clusterId).map(ClusterAuthUtils::getElasticConnectionDetail)
        .map(this::getClient)
        .orElseThrow(() -> new NotFoundException("Cluster not found"));
  }

  @Override
  public ElasticClient getClient(ClientConnectionDetail detail) {
    try {
      var authHeader = detail.authHeader();
      HttpClient jdkHttpClient = HttpClient.newBuilder()
          .sslContext(getSSLContext())
          .build();

      RestClient genericClient = RestClient.builder()
          .baseUrl(detail.baseUrl())
          .defaultHeader(authHeader.key(), authHeader.value())
          .defaultHeader("Content-Type", "application/json")
          .requestFactory(new JdkClientHttpRequestFactory(jdkHttpClient))
          .build();

      return new ElasticClientImpl(genericClient);
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

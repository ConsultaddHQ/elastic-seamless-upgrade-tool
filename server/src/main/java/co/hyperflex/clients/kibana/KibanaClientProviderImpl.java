package co.hyperflex.clients.kibana;

import co.hyperflex.common.client.ClientConnectionDetail;
import co.hyperflex.common.exceptions.NotFoundException;
import co.hyperflex.core.repositories.ClusterRepository;
import co.hyperflex.core.services.secret.SecretStoreService;
import co.hyperflex.core.utils.ClusterAuthUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class KibanaClientProviderImpl implements KibanaClientProvider {

  private final ClusterRepository clusterRepository;
  private final SecretStoreService secretStoreService;

  public KibanaClientProviderImpl(ClusterRepository clusterRepository,
                                  SecretStoreService secretStoreService) {
    this.clusterRepository = clusterRepository;
    this.secretStoreService = secretStoreService;
  }

  @Override
  public KibanaClient getClient(String clusterId) {
    return clusterRepository.findById(clusterId).map(ClusterAuthUtils::getKibanaConnectionDetail)
        .map(this::getClient)
        .orElseThrow(() -> new NotFoundException("Cluster not found"));
  }

  @Override
  public KibanaClient getClient(ClientConnectionDetail detail) {
    RestClient client = RestClient.builder()
        .baseUrl(detail.baseUrl())
        .defaultHeader("Authorization", secretStoreService.getSecret(detail.secretKey()).value())
        .defaultHeader("Content-Type", "application/json")
        .defaultHeader("kbn-xsrf", "true")
        .build();
    return new KibanaClientImpl(client, detail.baseUrl());
  }
}

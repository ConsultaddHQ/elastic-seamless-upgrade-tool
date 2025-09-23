package co.hyperflex.clients.kibana;

import co.hyperflex.common.client.ClientConnectionDetail;
import co.hyperflex.common.exceptions.NotFoundException;
import co.hyperflex.core.repositories.ClusterRepository;
import co.hyperflex.core.utils.ClusterAuthUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class KibanaClientProviderImpl implements KibanaClientProvider {

  private final ClusterRepository clusterRepository;

  public KibanaClientProviderImpl(ClusterRepository clusterRepository) {
    this.clusterRepository = clusterRepository;
  }

  @Override
  public KibanaClient getClient(String clusterId) {
    return clusterRepository.findById(clusterId).map(ClusterAuthUtils::getKibanaConnectionDetail)
        .map(this::getClient)
        .orElseThrow(() -> new NotFoundException("Cluster not found"));
  }

  @Override
  public KibanaClient getClient(ClientConnectionDetail detail) {
    var authHeader = detail.authHeader();
    RestClient client = RestClient.builder()
        .baseUrl(detail.baseUrl())
        .defaultHeader(authHeader.key(), authHeader.value())
        .defaultHeader("Content-Type", "application/json")
        .defaultHeader("kbn-xsrf", "true")
        .build();
    return new KibanaClientImpl(client, detail.baseUrl());
  }

}

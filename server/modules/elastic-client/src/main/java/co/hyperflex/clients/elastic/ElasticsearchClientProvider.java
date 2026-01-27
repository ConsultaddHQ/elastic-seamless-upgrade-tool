package co.hyperflex.clients.elastic;

import co.hyperflex.clients.client.ClientConnectionDetail;
import jakarta.validation.constraints.NotNull;

public interface ElasticsearchClientProvider {
  ElasticClient getClient(@NotNull String clusterId);

  ElasticClient getClient(ClientConnectionDetail detail);
}

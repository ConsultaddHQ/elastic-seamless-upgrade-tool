package co.hyperflex.clients.elastic;

import co.hyperflex.common.client.ClientConnectionDetail;
import jakarta.validation.constraints.NotNull;

public interface ElasticsearchClientProvider {
  ElasticClient getClient(@NotNull String clusterId);

  ElasticClient getClient(ClientConnectionDetail detail);
}

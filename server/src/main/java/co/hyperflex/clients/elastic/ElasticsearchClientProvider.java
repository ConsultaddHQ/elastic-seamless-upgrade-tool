package co.hyperflex.clients.elastic;

import co.hyperflex.core.entites.clusters.ClusterEntity;
import jakarta.validation.constraints.NotNull;

public interface ElasticsearchClientProvider {
  ElasticClient getClient(@NotNull String clusterId);

  ElasticClient getClient(ClusterEntity cluster);
}

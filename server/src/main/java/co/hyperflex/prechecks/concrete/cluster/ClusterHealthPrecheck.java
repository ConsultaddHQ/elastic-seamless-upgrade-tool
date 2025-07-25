package co.hyperflex.prechecks.concrete.cluster;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.cluster.HealthResponse;
import co.hyperflex.prechecks.contexts.ClusterContext;
import co.hyperflex.prechecks.core.BaseClusterPrecheck;
import co.hyperflex.prechecks.core.PrecheckLogger;
import java.io.IOException;
import org.springframework.stereotype.Component;

@Component
public class ClusterHealthPrecheck extends BaseClusterPrecheck {

  @Override
  public String getName() {
    return "Cluster health check";
  }

  @Override
  public void run(ClusterContext context) {
    ElasticsearchClient client = context.getElasticClient().getElasticsearchClient();
    PrecheckLogger logger = context.getLogger();

    try {
      HealthResponse health = client.cluster().health();
      String status = health.status().jsonValue(); // e.g., "green", "yellow", "red"
      boolean isHealthy = "green".equalsIgnoreCase(status);

      String message = String.format("Cluster health status: '%s'. Expected: 'green'.", status);
      logger.info(message);

      if (!isHealthy) {
        logger.error("Cluster health check failed. " + message);
        throw new RuntimeException("Cluster health check failed. " + message);
      }

    } catch (IOException e) {
      logger.error("Failed to check cluster health", e);
      throw new RuntimeException("Failed to check cluster health", e);
    }
  }
}

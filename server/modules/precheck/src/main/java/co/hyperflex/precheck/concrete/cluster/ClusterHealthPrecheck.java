package co.hyperflex.precheck.concrete.cluster;

import co.hyperflex.precheck.contexts.ClusterContext;
import co.hyperflex.precheck.core.BaseClusterPrecheck;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class ClusterHealthPrecheck extends BaseClusterPrecheck {

  @Override
  public String getName() {
    return "Cluster health check";
  }

  @Override
  public void run(ClusterContext context) {
    Logger logger = context.getLogger();
    try {
      String status = context.getElasticClient().getHealthStatus();
      boolean isHealthy = "green".equalsIgnoreCase(status);

      logger.info("Cluster health status: '{}'. Expected: 'green'.", status);

      if (!isHealthy) {
        logger.error("Cluster health check failed");
        throw new RuntimeException();
      }
    } catch (Exception e) {
      logger.error("Failed to check cluster health", e);
      throw new RuntimeException();
    }
  }
}

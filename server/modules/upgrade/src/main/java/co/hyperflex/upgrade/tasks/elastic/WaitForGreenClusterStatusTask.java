package co.hyperflex.upgrade.tasks.elastic;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.dto.cat.health.HealthRecord;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.Task;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class WaitForGreenClusterStatusTask implements Task {

  private static final int MAX_RETRIES = 60;
  private static final int RETRY_DELAY_MILLIS = 5000;

  @Override
  public String getName() {
    return "Wait for green cluster status";
  }

  @Override
  public TaskResult run(Context context) {
    final ElasticClient client = context.elasticClient();
    final Logger logger = context.logger();

    for (int i = 0; i < MAX_RETRIES; i++) {
      try {
        List<HealthRecord> healthRecords = client.getHealth();
        if (healthRecords.stream().map(hr -> "green".equals(hr.getStatus()))
            .reduce(Boolean::logicalAnd).orElse(false)) {
          logger.info("Cluster health is green");
          return new TaskResult(true, "Cluster health is green.");
        }
        logger.warn("Attempt {}/{}: Cluster health is not green. Retrying in {}ms...", i + 1,
            MAX_RETRIES, RETRY_DELAY_MILLIS);
        Thread.sleep(RETRY_DELAY_MILLIS);
      } catch (InterruptedException e) {
        logger.error("Failed to check cluster health", e);
        throw new RuntimeException(e);
      }
    }
    logger.error("Cluster health did not become green after {} attempts.", MAX_RETRIES);
    return TaskResult.failure("Cluster health did not become green after multiple retries.");
  }

  @Override
  public boolean skip(Map<String, Boolean> flags) {
    return flags.getOrDefault("skipHealth", false);
  }
}

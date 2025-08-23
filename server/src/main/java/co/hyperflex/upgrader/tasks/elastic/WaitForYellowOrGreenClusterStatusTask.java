package co.hyperflex.upgrader.tasks.elastic;

import co.hyperflex.clients.elastic.dto.cat.health.HealthRecord;
import co.hyperflex.upgrader.tasks.Context;
import co.hyperflex.upgrader.tasks.Task;
import co.hyperflex.upgrader.tasks.TaskResult;
import java.util.List;
import org.slf4j.Logger;

public class WaitForYellowOrGreenClusterStatusTask implements Task {

  private static final int MAX_RETRIES = 60;
  private static final int RETRY_DELAY_MILLIS = 5000;

  @Override
  public String getName() {
    return "Wait for yellow or green cluster status";
  }

  @Override
  public TaskResult run(Context context) {
    final Logger logger = context.logger();

    for (int i = 0; i < MAX_RETRIES; i++) {
      try {
        List<HealthRecord> healthRecords = context.elasticClient().getHealth();
        if (healthRecords.stream()
            .map(hr -> "green".equals(hr.getStatus()) || "yellow".equals(hr.getStatus()))
            .reduce(Boolean::logicalAnd).orElse(false)) {
          logger.info("Cluster health is green or yellow");
          return new TaskResult(true, "Cluster health is green or yellow.");
        }
        logger.warn("Attempt {}/{}: Cluster health is red. Retrying in {}ms...", i + 1, MAX_RETRIES,
            RETRY_DELAY_MILLIS);
        Thread.sleep(RETRY_DELAY_MILLIS);
      } catch (InterruptedException e) {
        logger.error("Failed to check cluster health", e);
        throw new RuntimeException(e);
      }
    }
    logger.error("Cluster health did not become green or yellow after {} attempts.", MAX_RETRIES);
    return TaskResult.failure(
        "Cluster health did not become green or yellow after multiple retries.");
  }
}

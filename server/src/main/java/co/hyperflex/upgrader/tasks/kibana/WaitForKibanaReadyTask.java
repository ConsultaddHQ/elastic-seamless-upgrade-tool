package co.hyperflex.upgrader.tasks.kibana;

import co.hyperflex.clients.KibanaClient;
import co.hyperflex.upgrader.tasks.Context;
import co.hyperflex.upgrader.tasks.Task;
import co.hyperflex.upgrader.tasks.TaskResult;
import org.slf4j.Logger;

public class WaitForKibanaReadyTask implements Task {
  private static final int MAX_RETRIES = 30;
  private static final int RETRY_DELAY_MILLIS = 5000;

  @Override
  public TaskResult run(Context context) {
    final Logger logger = context.logger();
    final String host = context.node().getIp();
    final KibanaClient kibanaClient = context.kibanaClient();

    logger.info("Waiting for Kibana to become ready on {}...", host);

    try {
      for (int i = 0; i < MAX_RETRIES; i++) {
        if (kibanaClient.isKibanaReady(host)) {
          logger.info("Kibana is ready on {}.", host);
          return TaskResult.success("Kibana is ready.");
        } else {
          logger.warn("Attempt {}/{}: Kibana not ready yet on {}. Retrying in {}ms...", i + 1,
              MAX_RETRIES, host, RETRY_DELAY_MILLIS);
          Thread.sleep(RETRY_DELAY_MILLIS);
        }
      }
      logger.error("Kibana did not become ready on {} after {} attempts.", host, MAX_RETRIES);
      return TaskResult.failure("Kibana did not become ready.");

    } catch (InterruptedException e) {
      logger.error("Interrupted while waiting for Kibana to become ready on {}.", host);
      Thread.currentThread().interrupt();
      return TaskResult.failure("Interrupted while waiting: " + e.getMessage());
    }
  }
}

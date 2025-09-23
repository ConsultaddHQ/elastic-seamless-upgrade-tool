package co.hyperflex.upgrade.tasks.kibana;

import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.Task;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class WaitForKibanaPortTask implements Task {
  private static final int TIMEOUT_MILLIS = 2000;
  private static final int MAX_RETRIES = 30;
  private static final int RETRY_DELAY_MILLIS = 5000;

  @Override
  public String getName() {
    return "Wait for kibana http port";
  }

  @Override
  public TaskResult run(Context context) {
    final ClusterNodeEntity node = context.node();
    final Logger logger = context.logger();
    final String host = node.getIp();
    final int port = 5601; // Default Kibana port

    logger.info("Waiting for Kibana port ({}:{}) to become available...", host, port);

    try {
      for (int i = 0; i < MAX_RETRIES; i++) {
        try (Socket socket = new Socket()) {
          socket.connect(new InetSocketAddress(host, port), TIMEOUT_MILLIS);
          logger.info("Kibana port is available on {}:{}", host, port);
          return TaskResult.success("Kibana node is back up on port " + port);
        } catch (IOException e) {
          logger.warn("Attempt {}/{}: Kibana port {} not available yet on {}. Retrying in {}ms...",
              i + 1, MAX_RETRIES, port, host, RETRY_DELAY_MILLIS);
          Thread.sleep(RETRY_DELAY_MILLIS);
        }
      }
      logger.error("Kibana port {} did not become available on {} after {} attempts.", port, host,
          MAX_RETRIES);
      return TaskResult.failure("Kibana node did not come back up on port " + port);

    } catch (InterruptedException e) {
      logger.error("Interrupted while waiting for Kibana port to become available on {}:{}", host,
          port);
      Thread.currentThread().interrupt();
      return TaskResult.failure("Interrupted while waiting: " + e.getMessage());
    }
  }
}

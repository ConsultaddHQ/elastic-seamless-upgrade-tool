package co.hyperflex.precheck.concrete.node.kibana.os;

import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.clients.kibana.dto.GetKibanaStatusResponse;
import co.hyperflex.clients.kibana.dto.OsStats;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseKibanaNodePrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class KibanaNodeMemoryHealthPrecheck extends BaseKibanaNodePrecheck {
  @Override
  public String getName() {
    return "Memory Utilization check";
  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.WARNING;
  }

  @Override
  public void run(NodeContext context) {
    Logger logger = context.getLogger();
    String nodeId = context.getNode().getId();
    KibanaClient kibanaClient = context.getKibanaClient();

    GetKibanaStatusResponse details = kibanaClient.getKibanaNodeDetails(context.getNode().getIp());

    OsStats osStats = details.metrics().os();

    if (osStats == null) {
      logger.warn("No stats found for node: {}", nodeId);
      return;
    }

    long totalMemory = osStats.memory().totalInBytes();
    long freeMemory = osStats.memory().freeInBytes();
    long usedMemory = totalMemory - freeMemory;

    int memoryPercent = (int) ((usedMemory * 100.0) / totalMemory);

    long bitsInMB = 1024 * 1024;
    logger.info("Memory - Total: {} MB, Free: {} MB, Utilised: {}%%", totalMemory / bitsInMB, freeMemory / bitsInMB, memoryPercent);

    if (memoryPercent > 90) {
      logger.warn("Memory usage on node is {}", memoryPercent);
      logger.error("Memory usage check failed: current usage is {}, which exceeds the threshold of 90%", memoryPercent);
      throw new RuntimeException();
    }
  }
}

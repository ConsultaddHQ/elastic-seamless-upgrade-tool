package co.hyperflex.precheck.concrete.node.kibana.os;

import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.clients.kibana.dto.GetKibanaStatusResponse;
import co.hyperflex.clients.kibana.dto.OsStats;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseKibanaNodePrecheck;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class KibanaNodeCpuHealthPrecheck extends BaseKibanaNodePrecheck {
  @Override
  public String getName() {
    return "CPU Utilization check";
  }

  @Override
  public void run(NodeContext context) {
    Logger logger = context.getLogger();
    KibanaClient kibanaClient = context.getKibanaClient();

    GetKibanaStatusResponse details =
        kibanaClient.getKibanaNodeDetails(context.getNode().getIp());

    OsStats osStats = details.metrics().os();

    if (osStats == null) {
      logger.warn("No stats found for node");
      return;
    }

    double cpuPercent = osStats.load().fiveMinute();

    logger.info("CPU Utilization check completed for node.");
    logger.info("Current CPU Usage: {}%", cpuPercent);
    if (cpuPercent > 80) {
      logger.error("CPU utilization check failed: current usage is {}%, which exceeds the threshold of 80%", cpuPercent);
      throw new RuntimeException();
    }


  }
}

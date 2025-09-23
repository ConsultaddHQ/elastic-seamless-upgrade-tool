package co.hyperflex.precheck.concrete.node.elastic.os;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.dto.nodes.NodesStatsResponse;
import co.hyperflex.clients.elastic.dto.nodes.Stats;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseElasticNodePrecheck;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class ElasticNodeCpuHealthPrecheck extends BaseElasticNodePrecheck {
  @Override
  public String getName() {
    return "CPU Utilization check";
  }

  @Override
  public void run(NodeContext context) {
    Logger logger = context.getLogger();
    ElasticClient elasticClient = context.getElasticClient();
    String nodeId = context.getNode().getId();
    NodesStatsResponse stats = elasticClient.getNodesMetric(nodeId);
    Stats nodeStats = stats.getNodes().get(nodeId);
    if (nodeStats == null) {
      logger.warn("No stats found for node: {}", nodeId);
      return;
    }

    int cpuPercent = nodeStats.getOs().getCpu().getPercent();

    logger.info("CPU Utilization check completed for node: {}", nodeId);
    logger.info("CPU Usage: {}%", cpuPercent);
    if (cpuPercent > 80) {
      logger.error("CPU Utilization check failed. Current CPU usage is {}%, which exceeds the threshold of 80%", cpuPercent);
      throw new RuntimeException();
    }
  }
}

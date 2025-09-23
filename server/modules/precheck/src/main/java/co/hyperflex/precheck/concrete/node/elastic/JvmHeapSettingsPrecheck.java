package co.hyperflex.precheck.concrete.node.elastic;

import co.hyperflex.clients.elastic.dto.nodes.NodesStatsResponse;
import co.hyperflex.clients.elastic.dto.nodes.Stats;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseElasticNodePrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import java.util.Map;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class JvmHeapSettingsPrecheck extends BaseElasticNodePrecheck {

  @Override
  public String getName() {
    return "JVM heap settings check";
  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.WARNING;
  }

  @Override
  public void run(NodeContext context) {
    String nodeId = context.getNode().getId();
    Logger logger = context.getLogger();

    NodesStatsResponse response = context.getElasticClient().getNodesMetric(nodeId, "jvm");

    Map<String, Stats> nodes = response.getNodes();
    Stats node = nodes.get(nodeId);

    if (node == null) {
      throw new RuntimeException("Node with ID [" + nodeId + "] not found");
    }

    String name = node.getName();
    var jvmStats = node.getJvm();
    if (jvmStats == null || jvmStats.getMem() == null) {
      logger.info("{}: Skipping JVM heap check — JVM memory stats missing.", name);
      return;
    }

    var memStats = jvmStats.getMem();
    long heapInit = memStats.getHeapInitInBytes();
    long heapMax = memStats.getHeapMaxInBytes();

    double heapInitGB = heapInit / Math.pow(1024, 3);
    double heapMaxGB = heapMax / Math.pow(1024, 3);

    logger.info("{}: -Xms={}GB, -Xmx={}GB", name, heapInitGB, heapMaxGB);

    if (heapInit != heapMax) {
      logger.error("{} has mismatched -Xms and -Xmx values. They must be equal.", name);
      throw new RuntimeException();
    }
  }
}

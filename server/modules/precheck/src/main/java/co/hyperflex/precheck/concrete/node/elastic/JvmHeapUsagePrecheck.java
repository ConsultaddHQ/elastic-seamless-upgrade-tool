package co.hyperflex.precheck.concrete.node.elastic;

import co.hyperflex.clients.elastic.dto.nodes.Jvm;
import co.hyperflex.clients.elastic.dto.nodes.JvmMemoryStats;
import co.hyperflex.clients.elastic.dto.nodes.NodesStatsResponse;
import co.hyperflex.clients.elastic.dto.nodes.Stats;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseElasticNodePrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import java.util.Map;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class JvmHeapUsagePrecheck extends BaseElasticNodePrecheck {

  private static final double THRESHOLD_PERCENT = 75.0;

  @Override
  public String getName() {
    return "JVM Heap Usage Check";
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
    Jvm jvm = node.getJvm();
    if (jvm == null || jvm.getMem() == null) {
      logger.info("{}: Skipping heap usage check — missing JVM memory stats.", name);
      return;
    }

    JvmMemoryStats mem = jvm.getMem();
    Long heapUsed = mem.getHeapUsedInBytes();
    Long heapMax = mem.getHeapMaxInBytes();

    if (heapUsed == null || heapMax == null) {
      logger.info("{}: Skipping heap usage check — missing heap values.", name);
      return;
    }

    double usedPercent = (double) heapUsed / heapMax * 100;
    double heapUsedGB = heapUsed / Math.pow(1024, 3);
    double heapMaxGB = heapMax / Math.pow(1024, 3);

    logger.info("{}: Heap used = {}GB / {}GB ({}%%)", name, heapUsedGB, heapMaxGB,
        usedPercent);

    if (usedPercent >= THRESHOLD_PERCENT) {
      logger.warn(
          "{}: Heap usage is too high ({}%). It must be below {}%.", name, usedPercent, THRESHOLD_PERCENT
      );
      throw new RuntimeException();
    }
  }
}

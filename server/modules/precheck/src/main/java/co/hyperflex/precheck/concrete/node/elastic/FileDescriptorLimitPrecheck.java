package co.hyperflex.precheck.concrete.node.elastic;

import co.hyperflex.clients.elastic.dto.nodes.NodesStatsResponse;
import co.hyperflex.clients.elastic.dto.nodes.Process;
import co.hyperflex.clients.elastic.dto.nodes.Stats;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseElasticNodePrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import java.util.Map;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class FileDescriptorLimitPrecheck extends BaseElasticNodePrecheck {

  private static final long MIN_LIMIT = 65535;

  @Override
  public String getName() {
    return "File Descriptor Limit Check";
  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.WARNING;
  }

  @Override
  public void run(NodeContext context) {
    String nodeId = context.getNode().getId();
    var client = context.getElasticClient();
    Logger logger = context.getLogger();

    NodesStatsResponse response = client.getNodesMetric(nodeId, "stats/process");

    Map<String, Stats> nodes = response.getNodes();
    Stats node = nodes.get(nodeId);

    if (node == null) {
      throw new RuntimeException("Node with ID [" + nodeId + "] not found in cluster");
    }

    String name = node.getName();
    Process process = node.getProcess();

    if (process == null || process.getMaxFileDescriptors() == null
        || process.getOpenFileDescriptors() == null) {
      logger.info("{}: Skipping file descriptor check — missing metrics.", name);
      return;
    }

    long maxFD = process.getMaxFileDescriptors();
    long openFD = process.getOpenFileDescriptors();
    double usagePercent = (double) openFD / maxFD * 100;

    logger.info("{}: Open FDs = {}, Max FDs = {} ({}% in use)", name, openFD, maxFD, usagePercent);

    if (maxFD < MIN_LIMIT) {
      logger.error("{}: Max file descriptor limit ({}) is below the recommended minimum ({}).", name, maxFD, MIN_LIMIT);
      logger.error("Consider increasing 'ulimit -n' and systemd LimitNOFILE.");
      throw new RuntimeException();
    }
  }
}

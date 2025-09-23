package co.hyperflex.precheck.concrete.cluster;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.dto.nodes.NodeInfo;
import co.hyperflex.clients.elastic.dto.nodes.NodeRole;
import co.hyperflex.precheck.contexts.ClusterContext;
import co.hyperflex.precheck.core.BaseClusterPrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import java.util.Collection;
import java.util.List;
import java.util.function.Predicate;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class MasterEligibleNodesPrecheck extends BaseClusterPrecheck {

  @Override
  public String getName() {
    return "Minimum number of master-eligible nodes";
  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.WARNING;
  }

  @Override
  public void run(ClusterContext context) {
    ElasticClient client = context.getElasticClient();
    Logger logger = context.getLogger();

    Collection<NodeInfo> nodes = client.getNodesInfo().getNodes().values();

    int totalNodes = nodes.size();

    List<NodeInfo> masterEligibleNodes =
        nodes.stream().filter(isMasterNode())
            .toList();

    int masterCount = masterEligibleNodes.size();

    logger.info("Found {} master-eligible node(s) out of {} total node(s).", masterCount, totalNodes);

    boolean isSmallCluster = totalNodes <= 3;

    if (isSmallCluster) {
      logger.info("Small cluster detected ({} total node{}). For production high availability,"
          + " it's recommended to have at least 3 master-eligible nodes.", totalNodes, totalNodes > 1 ? "s" : "");
      return;
    }

    if (masterCount % 2 == 0) {
      logger.warn("Even number ({}) of master-eligible nodes detected. Consider using an "
          + "odd number (e.g., {}) to avoid split-brain scenarios.", masterCount, masterCount + 1);
    }

    int quorum = (masterCount / 2) + 1;
    int toleratedFailures = masterCount - quorum;

    logger.info("Master quorum requirement: {} out of {} master-eligible nodes."
        + " Cluster can tolerate up to {} failure(s) and still elect a master.", quorum, masterCount, toleratedFailures);

    if (masterCount < 3) {
      logger.error("Only {} master-eligible node{} detected. This is below the recommended minimum of 3 for safe master elections.",
          masterCount, masterCount > 1 ? "s" : "");
      logger.error("Insufficient master-eligible nodes: found {} need at least 3 for high availability.", masterCount);
      throw new RuntimeException();
    }

  }

  private Predicate<NodeInfo> isMasterNode() {
    return n -> n.getRoles() != null && n.getRoles().contains(NodeRole.Master);
  }
}

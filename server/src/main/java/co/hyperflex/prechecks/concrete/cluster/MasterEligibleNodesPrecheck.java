package co.hyperflex.prechecks.concrete.cluster;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.cat.nodes.NodesRecord;
import co.hyperflex.prechecks.contexts.ClusterContext;
import co.hyperflex.prechecks.core.BaseClusterPrecheck;
import co.hyperflex.prechecks.core.PrecheckLogger;
import java.io.IOException;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class MasterEligibleNodesPrecheck extends BaseClusterPrecheck {

  @Override
  public String getName() {
    return "Minimum number of master-eligible nodes";
  }

  @Override
  public void run(ClusterContext context) {
    ElasticsearchClient client = context.getElasticClient().getElasticsearchClient();
    PrecheckLogger logger = context.getLogger();

    try {
      List<NodesRecord> nodes = client.cat().nodes(n -> n
          .h("name", "node.role")
      ).valueBody();

      int totalNodes = nodes.size();

      List<NodesRecord> masterEligibleNodes = nodes.stream()
          .filter(n -> n.nodeRole() != null && n.nodeRole().contains("m"))
          .toList();

      int masterCount = masterEligibleNodes.size();

      logger.info("Found %s master-eligible node(s) out of %s total node(s).", masterCount,
          totalNodes);

      boolean isSmallCluster = totalNodes <= 3;

      if (isSmallCluster) {
        logger.info(
            "Small cluster detected (%s total node%s). For production high availability,"
                + " it's recommended to have at least 3 master-eligible nodes.",
            totalNodes,
            totalNodes > 1 ? "s" : ""
        );
        return;
      }

      if (masterCount % 2 == 0) {
        logger.warn(
            "⚠️ Even number (%s) of master-eligible nodes detected. Consider using an "
                + "odd number (e.g., %s) to avoid split-brain scenarios.",
            masterCount,
            masterCount + 1
        );
      }

      int quorum = (masterCount / 2) + 1;
      int toleratedFailures = masterCount - quorum;

      logger.info(
          "Master quorum requirement: %s out of %s master-eligible nodes."
              + " Cluster can tolerate up to %s failure(s) and still elect a master.",
          quorum,
          masterCount,
          toleratedFailures
      );

      if (masterCount < 3) {
        logger.error(
            "Only %s master-eligible node%s detected. This is below the recommended"
                + " minimum of 3 for safe master elections.",
            masterCount,
            masterCount > 1 ? "s" : ""
        );

        throw new RuntimeException(
            String.format(
                "Insufficient master-eligible nodes: found %s,"
                    +
                    " need at least 3 for high availability.",
                masterCount)
        );
      }

    } catch (IOException e) {
      throw new RuntimeException("Failed to fetch node information from cluster", e);
    }
  }
}

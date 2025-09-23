
package co.hyperflex.precheck.concrete.cluster;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.dto.nodes.NodeInfo;
import co.hyperflex.clients.elastic.dto.nodes.NodeRole;
import co.hyperflex.precheck.contexts.ClusterContext;
import co.hyperflex.precheck.core.BaseClusterPrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class HighAvailabilityPrecheck extends BaseClusterPrecheck {

  @Override
  public String getName() {
    return "High Availability Check: minimum 2 nodes for each role";
  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.ERROR; // Failing this is critical for HA
  }

  @Override
  public void run(ClusterContext context) {
    ElasticClient client = context.getElasticClient();
    Logger logger = context.getLogger();

    Collection<NodeInfo> nodes = client.getNodesInfo().getNodes().values();

    // Collect role -> nodes mapping
    Map<NodeRole, List<NodeInfo>> roleToNodes = new EnumMap<>(NodeRole.class);
    for (NodeInfo node : nodes) {
      if (node.getRoles() == null) {
        continue;
      }
      for (NodeRole role : node.getRoles()) {
        roleToNodes.computeIfAbsent(role, r -> new ArrayList<>()).add(node);
      }
    }

    logger.info("Checking high availability across {} role(s) and {} node(s)...",
        roleToNodes.size(), nodes.size());

    boolean violation = false;

    for (Map.Entry<NodeRole, List<NodeInfo>> entry : roleToNodes.entrySet()) {
      NodeRole role = entry.getKey();
      int count = entry.getValue().size();

      if (count < 2) {
        logger.error("Role [{}] has only {} node(s). At least 2 are required for high availability.",
            role, count);
        violation = true;
      } else {
        logger.info("Role [{}] meets HA requirement with {} nodes.", role, count);
      }
    }

    if (violation) {
      throw new RuntimeException(
          "Cluster does not satisfy high availability requirements. Each role must have at least 2 nodes.");
    }
  }
}

package co.hyperflex.precheck.concrete.node.elastic;

import co.hyperflex.clients.elastic.dto.nodes.NodeInfo;
import co.hyperflex.clients.elastic.dto.nodes.NodesInfoResponse;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseElasticNodePrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import java.util.Map;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class ElasticVersionPrecheck extends BaseElasticNodePrecheck {

  @Override
  public String getName() {
    return "Elasticsearch Version Check";
  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.WARNING;
  }

  @Override
  public void run(NodeContext context) {
    String nodeId = context.getNode().getId();

    String expectedVersion = context.getClusterUpgradeJob().getCurrentVersion();
    Logger logger = context.getLogger();

    NodesInfoResponse response = context.getElasticClient().getNodeInfo(nodeId);
    Map<String, NodeInfo> nodes = response.getNodes();
    NodeInfo node = nodes.get(nodeId);

    if (node == null) {
      throw new RuntimeException("Node with ID [" + nodeId + "] not found.");
    }

    String actualVersion = node.getVersion();
    if (expectedVersion.equals(actualVersion)) {
      logger.info("Node [{}] is running on the expected version: {}.", node.getName(),
          expectedVersion);
    } else {
      logger.error("Node [{}] version mismatch: expected {}, but found {}.",
          node.getName(), expectedVersion, actualVersion);
      throw new RuntimeException();
    }
  }
}

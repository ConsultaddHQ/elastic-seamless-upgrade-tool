package co.hyperflex.prechecks.concrete.node.elastic;


import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.PluginStats;
import co.elastic.clients.elasticsearch.nodes.NodesInfoResponse;
import co.elastic.clients.elasticsearch.nodes.info.NodeInfo;
import co.hyperflex.entities.precheck.PrecheckSeverity;
import co.hyperflex.prechecks.contexts.NodeContext;
import co.hyperflex.prechecks.core.BaseElasticNodePrecheck;
import co.hyperflex.prechecks.core.PrecheckLogger;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class CustomPluginsListPrecheck extends BaseElasticNodePrecheck {

  private static final Set<String> BUNDLED_PLUGINS = Set.of(
      "x-pack-core",
      "x-pack-security",
      "x-pack-ml",
      "x-pack-monitoring",
      "x-pack-apm",
      "x-pack-logstash",
      "x-pack-deprecation",
      "x-pack-ilm",
      "x-pack-sql",
      "x-pack-rollup",
      "x-pack-stack",
      "x-pack-ccr",
      "x-pack-analytics",
      "repository-gcs",
      "repository-azure",
      "repository-s3"
  );

  @Override
  public String getName() {
    return "Manually Installed Plugins Check";
  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.INFO;
  }

  @Override
  public void run(NodeContext context) {
    String nodeId = context.getNode().getId();
    ElasticsearchClient client = context.getElasticClient().getElasticsearchClient();
    PrecheckLogger logger = context.getLogger();

    try {
      NodesInfoResponse nodeInfoResponse = client.nodes().info(r -> r
          .nodeId(nodeId)
          .metric("plugins")
      );

      Map<String, NodeInfo> nodes = nodeInfoResponse.nodes();
      NodeInfo nodeInfo = nodes.get(nodeId);

      if (nodeInfo == null) {
        throw new RuntimeException("Node with ID [" + nodeId + "] not found.");
      }

      if (nodeInfo.plugins() == null || nodeInfo.plugins().isEmpty()) {
        throw new RuntimeException(
            "Plugins information for node [" + nodeInfo.name() + "] not found or invalid.");
      }

      List<String> installedPlugins = nodeInfo.plugins().stream()
          .map(PluginStats::name)
          .filter(Objects::nonNull)
          .toList();

      List<String> customPlugins = installedPlugins.stream()
          .filter(name -> !BUNDLED_PLUGINS.contains(name))
          .toList();

      if (customPlugins.isEmpty()) {
        logger.info("Node [%s] has no manually installed plugins.", nodeInfo.name());
      } else {
        logger.info(
            "Node [%s] has manually installed plugins: %s",
            nodeInfo.name(),
            String.join(", ", customPlugins)
        );
      }
    } catch (IOException e) {
      throw new RuntimeException("Failed to check installed plugins for node: " + nodeId, e);
    }
  }
}

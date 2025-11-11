package co.hyperflex.precheck.concrete.node.elastic;


import co.hyperflex.clients.elastic.dto.nodes.PluginStats;
import co.hyperflex.common.exceptions.NotFoundException;
import co.hyperflex.pluginmanager.PluginManagerFactory;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseElasticNodePrecheck;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component
public class CustomPluginsListPrecheck extends BaseElasticNodePrecheck {
  private final PluginManagerFactory pluginManagerFactory;

  public CustomPluginsListPrecheck(PluginManagerFactory pluginManagerFactory) {
    this.pluginManagerFactory = pluginManagerFactory;
  }

  @Override
  public String getName() {
    return "Manually Installed Plugins Check";
  }

  @Override
  public void run(NodeContext context) {
    var nodeId = context.getNode().getId();
    var client = context.getElasticClient();
    var logger = context.getLogger();

    var nodeInfoResponse = client.getNodeInfo(nodeId);

    var nodes = nodeInfoResponse.getNodes();
    var nodeInfo = nodes.get(nodeId);

    if (nodeInfo == null) {
      throw new NotFoundException("Node with ID [" + nodeId + "] not found.");
    }

    if (nodeInfo.getPlugins() == null || nodeInfo.getPlugins().isEmpty()) {
      logger.info("No custom plugins detected on node [{}].", nodeInfo.getName());
      return;
    }

    logger.info("Detected manually installed plugins on node [{}]:", nodeInfo.getName());
    var plugins = nodeInfo.getPlugins().stream()
        .map(PluginStats::getName)
        .filter(Objects::nonNull)
        .toList();

    plugins.forEach(plugin -> logger.info("  • {}", plugin));

    var targetVersion = context.getClusterUpgradeJob().getTargetVersion();
    logger.info("Verifying plugin availability for target version [{}]...", targetVersion);

    boolean verificationFailed = false;
    var pluginManager = pluginManagerFactory.create(null, context.getNode().getType());

    for (var plugin : plugins) {
      try {
        boolean available = pluginManager.isPluginAvailable(plugin, targetVersion);
        if (available) {
          logger.info("  • {} is available for target version [{}].", plugin, targetVersion);
        } else {
          logger.warn("  • {} is not available for target version [{}].", plugin, targetVersion);
          verificationFailed = true;
        }
      } catch (Exception e) {
        logger.error("Unable to verify availability for plugin [{}]. It may be unsupported or no source is configured.", plugin);
        verificationFailed = true;
      }
    }

    if (verificationFailed) {
      logger.info("One or more plugins are unavailable or could not be verified. Please review logs for details.");
      throw new RuntimeException();
    }
  }
}

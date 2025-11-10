package co.hyperflex.precheck.concrete.node.kibana;


import co.hyperflex.core.models.enums.ClusterType;
import co.hyperflex.pluginmanager.PluginManagerFactory;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseKibanaNodePrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import java.io.IOException;
import java.util.List;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class CustomKibanaPluginsPrecheck extends BaseKibanaNodePrecheck {
  private final PluginManagerFactory pluginManagerFactory;

  public CustomKibanaPluginsPrecheck(PluginManagerFactory pluginManagerFactory) {
    this.pluginManagerFactory = pluginManagerFactory;
  }

  @Override
  public String getName() {
    return "Manually Installed Plugins Check";
  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.WARNING;
  }

  @Override
  public boolean shouldRun(NodeContext context) {
    return super.shouldRun(context) && context.getCluster().getType() == ClusterType.SELF_MANAGED;
  }

  @Override
  public void run(NodeContext context) {
    String nodeId = context.getNode().getId();
    Logger logger = context.getLogger();

    try (var executor = context.getSshExecutor()) {
      var pluginManager = pluginManagerFactory.create(executor, context.getNode().getType());
      List<String> plugins = pluginManager.listPlugins();

      if (plugins.isEmpty()) {
        logger.info("No custom plugins detected on node [{}].", nodeId);
        return;
      }

      logger.info("Detected manually installed plugins on node [{}]:", context.getNode().getName());
      plugins.forEach(plugin -> logger.info("  • {}", plugin));

      var targetVersion = context.getClusterUpgradeJob().getTargetVersion();
      logger.info("Verifying plugin compatibility for target version [{}]...", targetVersion);

      boolean verificationFailed = false;

      for (var plugin : plugins) {
        try {
          boolean available = pluginManager.isPluginAvailable(plugin, targetVersion);
          if (available) {
            logger.info("{} is available for target version [{}].", plugin, targetVersion);
          } else {
            logger.warn("{} is not available for target version [{}].", plugin, targetVersion);
            verificationFailed = true;
          }
        } catch (Exception e) {
          logger.error("Unable to verify availability for plugin [{}]. It may be unsupported or no source is configured.", plugin);
          verificationFailed = true;
        }
      }

      if (verificationFailed) {
        logger.error("One or more plugins are unavailable or could not be verified. Please review logs for details.");
        throw new RuntimeException();
      }
    } catch (IOException e) {
      logger.error("Error while executing SSH command for plugin verification: " + e.getMessage());
      throw new RuntimeException(e);
    }
  }
}

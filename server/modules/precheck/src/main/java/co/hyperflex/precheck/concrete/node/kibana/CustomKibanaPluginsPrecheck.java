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
        logger.info("No plugins found for node with ID [{}].", nodeId);
        return;
      }

      logger.info("Node [{}] has manually installed plugins:", context.getNode().getName());

      plugins.forEach(plugin -> logger.info("* {}", plugin));

      var targetVersion = context.getClusterUpgradeJob().getTargetVersion();
      logger.info("Checking plugin availability for target version [{}]", targetVersion);

      boolean unavailable = false;
      for (var plugin : plugins) {
        try {
          boolean available = pluginManager.isPluginAvailable(plugin, targetVersion);
          logger.info("* {} : {}", plugin, available ? "available" : "unavailable");
        } catch (Exception e) {
          logger.info(
              "* {} : Unable to verify plugin — it may be unavailable or no source is configured",
              plugin
          );
          unavailable = true;
        }
      }
      if (unavailable) {
        throw new RuntimeException();
      }
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }
}

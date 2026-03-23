package co.hyperflex.upgrade.tasks;

import co.hyperflex.pluginmanager.PluginManagerFactory;
import co.hyperflex.ssh.SshCommandExecutor;
import java.util.List;
import org.slf4j.Logger;

public abstract class AbstractUpdatePluginTask implements Task {
  private final PluginManagerFactory pluginManagerFactory;

  protected AbstractUpdatePluginTask(PluginManagerFactory pluginManagerFactory) {
    this.pluginManagerFactory = pluginManagerFactory;
  }

  @Override
  public TaskResult run(Context context) {
    Logger logger = context.logger();
    try (SshCommandExecutor executor = context.getSshCommandExecutor()) {
      var pluginManager = pluginManagerFactory.create(executor, context.node().getType());

      logger.info("Getting list of installed plugins via filesystem");
      List<String> plugins = pluginManager
          .listPluginsViaFileSystem()
          .stream()
          .filter(plugin -> !plugin.startsWith("WARNING:"))
          .toList();

      if (plugins.isEmpty()) {
        context.logger().info("No plugins found");
        return TaskResult.success("No plugins found");
      }

      logger.info("Found {} plugins[{}]", plugins.size(), String.join(", ", plugins));

      logger.info("Purging old plugin directories...");
      pluginManager.purgePluginDirectory();
      logger.info("Successfully purged plugin directory.");

      // Reinstall plugins
      for (String plugin : plugins) {
        logger.info("Installing new 8.x plugin [{}]", plugin);
        pluginManager.installPlugin(plugin, context.config().targetVersion());
        logger.info("Successfully installed plugin [{}]", plugin);
      }
      return TaskResult.success("Plugins updated successfully");

    } catch (Exception e) {
      logger.error("Plugin update failed: {}", e.getMessage(), e);
      return TaskResult.failure(e.getMessage());
    }
  }
}
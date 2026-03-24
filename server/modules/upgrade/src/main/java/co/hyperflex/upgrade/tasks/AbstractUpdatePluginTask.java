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
      var pluginManger = pluginManagerFactory.create(executor, context.node().getType());
      logger.info("Getting list of installed plugins via filesystem");
      List<String> plugins = pluginManger
          .listPlugins()
          .stream()
          .filter(plugin -> !plugin.startsWith("WARNING:"))
          .toList();

      if (plugins.isEmpty()) {
        context.logger().info("No plugins found");
        return TaskResult.success("No plugins found");
      }

      logger.info("Found {} plugins[{}]", plugins.size(), String.join(", ", plugins));

      // PASS 1: Purge ALL 7.x plugins first so the 8.x CLI doesn't crash on startup
      logger.info("Performing bulk purge of old plugin directories...");
      for (String plugin : plugins) {
        logger.info("Purging old directory for plugin [{}]", plugin);
        pluginManger.removePlugin(plugin);
      }
      logger.info("Bulk purge complete. Plugin directory is clean.");

      // PASS 2: Install valid 8.x plugins
      logger.info("Beginning 8.x plugin installations...");
      for (String plugin : plugins) {

        // Skip native modules bundled in 8.x
        if (context.config().targetVersion().startsWith("8.")
            && (plugin.equals("repository-gcs") || plugin.equals("repository-s3") || plugin.equals("repository-azure"))) {
          logger.info("Plugin [{}] is natively bundled as a module in Elastic 8.x. Skipping installation.", plugin);
          continue;
        }

        logger.info("Installing new 8.x plugin [{}]", plugin);
        pluginManger.installPlugin(plugin, context.config().targetVersion());
        logger.info("Successfully installed plugin [{}]", plugin);
      }

      return TaskResult.success("Plugins updated successfully");

    } catch (Exception e) {
      logger.error("Plugin update failed: {}", e.getMessage(), e);
      return TaskResult.failure(e.getMessage());
    }
  }
}
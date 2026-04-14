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
    String targetVersion = context.config().targetVersion();

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

      logger.info("Performing bulk Remove of old plugin directories...");
      for (String plugin : plugins) {
        logger.info("Removing old directory for plugin [{}]", plugin);
        pluginManger.removePlugin(plugin);
      }
      logger.info("Bulk Remove complete. Plugin directory is clean.");

      logger.info("Beginning plugin installations...");
      for (String plugin : plugins) {

        // for 7.x to 8.x, Skipping native modules bundled in 8.x
        if (targetVersion.startsWith("8.")
            && (plugin.equals("repository-gcs") || plugin.equals("repository-s3") || plugin.equals("repository-azure"))) {
          logger.info("Plugin [{}] is natively bundled as a module in Elastic 8.x. Skipping installation.", plugin);
          continue;
        }

        logger.info("Installing new 8.x plugin [{}]", plugin);
        pluginManger.installPlugin(plugin, targetVersion);
        logger.info("Successfully installed plugin [{}]", plugin);
      }

      return TaskResult.success("Plugins updated successfully");

    } catch (Exception e) {
      logger.error("Plugin update failed: {}", e.getMessage(), e);
      return TaskResult.failure(e.getMessage());
    }
  }
}
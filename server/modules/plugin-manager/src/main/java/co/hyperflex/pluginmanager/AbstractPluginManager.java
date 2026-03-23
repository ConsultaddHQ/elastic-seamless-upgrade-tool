package co.hyperflex.pluginmanager;

import co.hyperflex.ssh.SshCommandExecutor;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public abstract class AbstractPluginManager implements PluginManager {
  private final SshCommandExecutor executor;
  private final PluginSourceResolver pluginSourceResolver;
  private final PluginArtifactValidator pluginArtifactValidator;

  protected AbstractPluginManager(SshCommandExecutor executor, PluginSourceResolver pluginSourceResolver,
                                  PluginArtifactValidator pluginArtifactValidator) {
    this.executor = executor;
    this.pluginSourceResolver = pluginSourceResolver;
    this.pluginArtifactValidator = pluginArtifactValidator;
  }

  @Override
  public List<String> listPlugins() {
    try {
      var result = executor.execute(getBaseCommand() + "list");
      if (!result.isSuccess()) {
        throw new RuntimeException("Failed to list plugins: " + result.stderr());
      }
      if (result.stdout().contains("No plugins installed")) {
        return Collections.emptyList();
      }
      return Arrays.stream(result.stdout().split("\n")).map(String::trim).filter(p -> !p.isBlank()).toList();
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  @Override
  public void removePlugin(String pluginName) {
    try {
      var result = executor.execute(getBaseCommand() + "remove " + pluginName);
      if (!result.isSuccess()) {
        throw new RuntimeException("Failed to remove plugin " + pluginName + ": " + result.stderr());
      }
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  @Override
  public boolean isPluginAvailable(String pluginName, String version) {
    var source = pluginSourceResolver.resolve(pluginName, version);
    if (source != null && source.equals(pluginName)) {
      return true;
    }
    return pluginArtifactValidator.verifyPlugin(source, version);
  }

  @Override
  public void installPlugin(String pluginName, String version) {
    try {
      var source = pluginSourceResolver.resolve(pluginName, version);

      // Download the plugin directly using wget (bypassing Java SSL issues)
      // We download it to /tmp so it's safely out of the way
      String downloadCmd = "wget -q -O /tmp/" + pluginName + ".zip " + source;
      var downloadResult = executor.execute(downloadCmd);
      if (!downloadResult.isSuccess()) {
        throw new RuntimeException("Failed to download plugin file from [" + source + "]: " + downloadResult.stderr());
      }

      // Install the plugin using the local file path
      // Note the "file://" syntax which tells the CLI tool not to use the internet
      String installCmd = getBaseCommand() + "install --batch file:///tmp/" + pluginName + ".zip";
      var installResult = executor.execute(installCmd);

      if (!installResult.isSuccess()) {
        throw new RuntimeException("Failed to install [plugin: " + pluginName + "] from local file: " + installResult.stderr());
      }

      // Cleanup the temp file
      executor.execute("rm -f /tmp/" + pluginName + ".zip");

    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  protected abstract String getBaseCommand();

  protected abstract String getPluginDirectory();

  @Override
  public List<String> listPluginsViaFileSystem() {
    try {
      var result = executor.execute("sudo ls -1 " + getPluginDirectory());
      if (!result.isSuccess() || result.stdout().isBlank()) {
        return Collections.emptyList();
      }
      return Arrays.stream(result.stdout().split("\n"))
          .map(String::trim)
          .filter(p -> !p.isBlank())
          .toList();
    } catch (IOException e) {
      throw new RuntimeException("Failed to list plugins via filesystem", e);
    }
  }

  @Override
  public void purgePluginDirectory() {
    try {
      // Adding a trailing slash to ensure it deletes contents, not the directory itself
      var result = executor.execute("sudo rm -rf " + getPluginDirectory() + "*");
      if (!result.isSuccess()) {
        throw new RuntimeException("Failed to purge plugin directory: " + result.stderr());
      }
    } catch (IOException e) {
      throw new RuntimeException("Failed to execute purge command", e);
    }
  }
}
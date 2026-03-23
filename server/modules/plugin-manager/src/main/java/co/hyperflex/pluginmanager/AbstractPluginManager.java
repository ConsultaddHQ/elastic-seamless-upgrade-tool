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
      // Bypasses the CLI and reads the filesystem directly
      var result = executor.execute("ls -1 " + getPluginDirectory());
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
  public void removePlugin(String pluginName) {
    try {
      // Purges the old 7.x folder directly to prevent 8.x CLI crashes
      var result = executor.execute("rm -rf " + getPluginDirectory() + pluginName);
      if (!result.isSuccess()) {
        throw new RuntimeException("Failed to forcefully remove plugin folder " + pluginName + ": " + result.stderr());
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

      // 1. Download the plugin directly using wget (bypasses JVM SSL/CA issues)
      String downloadCmd = "wget -q -O /tmp/" + pluginName + ".zip " + source;
      var downloadResult = executor.execute(downloadCmd);
      if (!downloadResult.isSuccess()) {
        throw new RuntimeException("Failed to download plugin file from [" + source + "]: " + downloadResult.stderr());
      }

      // 2. Install the plugin using the local file path
      String installCmd = getBaseCommand() + "install --batch file:///tmp/" + pluginName + ".zip";
      var installResult = executor.execute(installCmd);
      if (!installResult.isSuccess()) {
        throw new RuntimeException("Failed to install [plugin: " + pluginName + "] from local file: " + installResult.stderr());
      }

      // 3. Cleanup the temp file to keep the server clean
      executor.execute("rm -f /tmp/" + pluginName + ".zip");

    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  protected abstract String getBaseCommand();

  protected abstract String getPluginDirectory();
}
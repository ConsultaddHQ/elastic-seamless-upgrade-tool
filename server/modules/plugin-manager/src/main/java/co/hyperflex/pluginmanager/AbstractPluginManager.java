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
      var result = executor.execute(getBaseCommand() + "install --batch " + source);
      if (!result.isSuccess()) {
        throw new RuntimeException("Failed to install [plugin: " + pluginName + "] from [source: " + source + "] : " + result.stderr());
      }
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  protected abstract String getBaseCommand();
}

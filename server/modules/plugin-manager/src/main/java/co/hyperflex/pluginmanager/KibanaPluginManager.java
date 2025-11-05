package co.hyperflex.pluginmanager;

import co.hyperflex.ssh.SshCommandExecutor;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class KibanaPluginManager extends AbstractPluginManager {
  private final SshCommandExecutor executor;

  protected KibanaPluginManager(SshCommandExecutor executor,
                                PluginSourceResolver pluginSourceResolver,
                                KibanaPluginArtifactValidator pluginArtifactValidator) {
    super(executor, pluginSourceResolver, pluginArtifactValidator);
    this.executor = executor;
  }

  @Override
  protected String getBaseCommand() {
    return "/usr/share/kibana/bin/kibana-plugin ";
  }

  @Override
  public List<String> listPlugins() {
    try {
      var result = executor.execute(getBaseCommand() + "list");
      if (!result.isSuccess()) {
        // Some version of kibana (7.2 ...) requires this flag to list plugins
        if (result.stdout().contains("--allow-root")) {
          var result1 = executor.execute(getBaseCommand() + "list --allow-root");
          if (!result1.isSuccess()) {
            result = result1;
          } else {
            throw new RuntimeException("Failed to list plugins: " + result.stderr());
          }
        } else {
          throw new RuntimeException("Failed to list plugins: " + result.stderr());
        }
      }
      if (result.stdout().contains("No plugins installed")) {
        return Collections.emptyList();
      }
      return Arrays.stream(result.stdout().split("\n")).map(String::trim).filter(p -> !p.isBlank()).toList();
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }
}
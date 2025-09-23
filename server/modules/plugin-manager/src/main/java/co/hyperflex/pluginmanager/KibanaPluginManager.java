package co.hyperflex.pluginmanager;

import co.hyperflex.ssh.SshCommandExecutor;

public class KibanaPluginManager extends AbstractPluginManager {

  protected KibanaPluginManager(SshCommandExecutor executor,
                                PluginSourceResolver pluginSourceResolver,
                                KibanaPluginArtifactValidator pluginArtifactValidator) {
    super(executor, pluginSourceResolver, pluginArtifactValidator);
  }

  @Override
  protected String getBaseCommand() {
    return "/usr/share/kibana/bin/kibana-plugin ";
  }

}

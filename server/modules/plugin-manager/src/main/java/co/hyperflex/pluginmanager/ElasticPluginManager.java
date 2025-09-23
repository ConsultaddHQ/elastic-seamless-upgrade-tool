package co.hyperflex.pluginmanager;

import co.hyperflex.ssh.SshCommandExecutor;

public class ElasticPluginManager extends AbstractPluginManager {

  protected ElasticPluginManager(SshCommandExecutor executor, PluginSourceResolver pluginSourceResolver,
                                 ElasticPluginArtifactValidator elasticPluginArtifactValidator) {
    super(executor, pluginSourceResolver, elasticPluginArtifactValidator);
  }

  @Override
  protected String getBaseCommand() {
    return "/usr/share/elasticsearch/bin/elasticsearch-plugin ";
  }

}

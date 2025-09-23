package co.hyperflex.pluginmanager;

import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.ssh.SshCommandExecutor;
import org.springframework.stereotype.Component;

@Component
public class PluginManagerFactory {
  private final ElasticPluginArtifactValidator elasticPluginArtifactValidator;
  private final KibanaPluginArtifactValidator kibanaPluginArtifactValidator;
  private final PluginSourceResolver pluginSourceResolver;

  public PluginManagerFactory(ElasticPluginArtifactValidator elasticPluginArtifactValidator,
                              KibanaPluginArtifactValidator kibanaPluginArtifactValidator,
                              PluginSourceResolver pluginSourceResolver) {
    this.elasticPluginArtifactValidator = elasticPluginArtifactValidator;
    this.kibanaPluginArtifactValidator = kibanaPluginArtifactValidator;
    this.pluginSourceResolver = pluginSourceResolver;
  }

  public PluginManager create(SshCommandExecutor executor, ClusterNodeType nodeType) {
    if (nodeType == ClusterNodeType.ELASTIC) {
      return new ElasticPluginManager(
          executor,
          pluginSourceResolver,
          elasticPluginArtifactValidator
      );
    } else if (nodeType == ClusterNodeType.KIBANA) {
      return new KibanaPluginManager(
          executor,
          pluginSourceResolver,
          kibanaPluginArtifactValidator
      );
    }
    throw new IllegalArgumentException("Unknown node type: " + nodeType);
  }
}

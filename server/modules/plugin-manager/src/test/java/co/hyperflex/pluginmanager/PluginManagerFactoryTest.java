package co.hyperflex.pluginmanager;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;

import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.ssh.SshCommandExecutor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PluginManagerFactoryTest {

  @Mock
  private ElasticPluginArtifactValidator elasticPluginArtifactValidator;
  @Mock
  private KibanaPluginArtifactValidator kibanaPluginArtifactValidator;
  @Mock
  private PluginSourceResolver pluginSourceResolver;
  @Mock
  private SshCommandExecutor executor;

  @InjectMocks
  private PluginManagerFactory pluginManagerFactory;

  @Test
  void create_withElasticNodeType_shouldReturnElasticPluginManager() {
    PluginManager manager = pluginManagerFactory.create(executor, ClusterNodeType.ELASTIC);
    assertInstanceOf(ElasticPluginManager.class, manager);
  }

  @Test
  void create_withKibanaNodeType_shouldReturnKibanaPluginManager() {
    PluginManager manager = pluginManagerFactory.create(executor, ClusterNodeType.KIBANA);
    assertInstanceOf(KibanaPluginManager.class, manager);
  }

  @Test
  void create_withNullNodeType_shouldThrowException() {
    assertThrows(IllegalArgumentException.class, () -> pluginManagerFactory.create(executor, null));
  }
}

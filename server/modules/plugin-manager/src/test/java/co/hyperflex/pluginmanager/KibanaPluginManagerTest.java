package co.hyperflex.pluginmanager;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import co.hyperflex.ssh.CommandResult;
import co.hyperflex.ssh.SshCommandExecutor;
import java.io.IOException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class KibanaPluginManagerTest {

  @Mock
  private SshCommandExecutor executor;
  @Mock
  private PluginSourceResolver pluginSourceResolver;
  @Mock
  private KibanaPluginArtifactValidator pluginArtifactValidator;

  private KibanaPluginManager pluginManager;

  @BeforeEach
  void setUp() {
    pluginManager = new KibanaPluginManager(executor, pluginSourceResolver, pluginArtifactValidator);
  }

  private String getBaseCommand() {
    return "/usr/share/kibana/bin/kibana-plugin ";
  }

  private String getPluginDirectory() {
    return "/usr/share/kibana/plugins/";
  }

  @Test
  void removePlugin_whenCommandSucceeds_shouldNotThrowException() throws IOException {
    // Updated to expect the filesystem rm command
    when(executor.execute("rm -rf " + getPluginDirectory() + "my-plugin")).thenReturn(new CommandResult(0, "", ""));

    assertDoesNotThrow(() -> pluginManager.removePlugin("my-plugin"));
  }


  @Test
  void isPluginAvailable_whenVerificationSucceeds_shouldReturnTrue() {
    when(pluginSourceResolver.resolve("my-plugin", "1.0.0")).thenReturn("http://example.com/plugin.zip");
    when(pluginArtifactValidator.verifyPlugin("http://example.com/plugin.zip", "1.0.0")).thenReturn(true);

    assertTrue(pluginManager.isPluginAvailable("my-plugin", "1.0.0"));
  }
}
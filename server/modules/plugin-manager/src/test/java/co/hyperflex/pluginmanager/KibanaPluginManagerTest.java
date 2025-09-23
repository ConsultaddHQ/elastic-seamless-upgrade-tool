package co.hyperflex.pluginmanager;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import co.hyperflex.ssh.CommandResult;
import co.hyperflex.ssh.SshCommandExecutor;
import java.io.IOException;
import java.util.List;
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

  @Test
  void listPlugins_whenPluginsExist_shouldReturnPluginList() throws IOException {
    String commandOutput = "plugin1\nplugin2 ";
    when(executor.execute(getBaseCommand() + "list")).thenReturn(new CommandResult(0, commandOutput, ""));
    List<String> plugins = pluginManager.listPlugins();
    assertEquals(2, plugins.size());
    assertTrue(plugins.contains("plugin1"));
    assertTrue(plugins.contains("plugin2"));
  }

  @Test
  void removePlugin_whenCommandSucceeds_shouldNotThrowException() throws IOException {
    when(executor.execute(getBaseCommand() + "remove my-plugin")).thenReturn(new CommandResult(0, "", ""));
    assertDoesNotThrow(() -> pluginManager.removePlugin("my-plugin"));
  }

  @Test
  void installPlugin_whenCommandSucceeds_shouldNotThrowException() throws IOException {
    when(pluginSourceResolver.resolve("my-plugin", "1.0.0")).thenReturn("http://example.com/plugin.zip");
    when(executor.execute(getBaseCommand() + "install --batch http://example.com/plugin.zip")).thenReturn(new CommandResult(0, "", ""));
    assertDoesNotThrow(() -> pluginManager.installPlugin("my-plugin", "1.0.0"));
  }

  @Test
  void isPluginAvailable_whenVerificationSucceeds_shouldReturnTrue() {
    when(pluginSourceResolver.resolve("my-plugin", "1.0.0")).thenReturn("http://example.com/plugin.zip");
    when(pluginArtifactValidator.verifyPlugin("http://example.com/plugin.zip", "1.0.0")).thenReturn(true);
    assertTrue(pluginManager.isPluginAvailable("my-plugin", "1.0.0"));
  }
}

package co.hyperflex.pluginmanager;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
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
class ElasticPluginManagerTest {

  @Mock
  private SshCommandExecutor executor;
  @Mock
  private PluginSourceResolver pluginSourceResolver;
  @Mock
  private ElasticPluginArtifactValidator pluginArtifactValidator;

  private ElasticPluginManager pluginManager;

  @BeforeEach
  void setUp() {
    pluginManager = new ElasticPluginManager(executor, pluginSourceResolver, pluginArtifactValidator);
  }

  private String getBaseCommand() {
    return "/usr/share/elasticsearch/bin/elasticsearch-plugin ";
  }

  @Test
  void listPlugins_whenPluginsExist_shouldReturnPluginList() throws IOException {
    String commandOutput = "plugin1\nplugin2";
    when(executor.execute(getBaseCommand() + "list")).thenReturn(new CommandResult(0, commandOutput, ""));
    List<String> plugins = pluginManager.listPlugins();
    assertEquals(2, plugins.size());
    assertTrue(plugins.contains("plugin1"));
    assertTrue(plugins.contains("plugin2"));
  }

  @Test
  void listPlugins_whenNoPluginsInstalled_shouldReturnEmptyList() throws IOException {
    String commandOutput = "No plugins installed";
    when(executor.execute(getBaseCommand() + "list")).thenReturn(new CommandResult(0, commandOutput, ""));
    List<String> plugins = pluginManager.listPlugins();
    assertTrue(plugins.isEmpty());
  }

  @Test
  void listPlugins_whenCommandFails_shouldThrowRuntimeException() throws IOException {
    when(executor.execute(getBaseCommand() + "list")).thenReturn(new CommandResult(1, "", "error"));
    assertThrows(RuntimeException.class, () -> pluginManager.listPlugins());
  }

  @Test
  void listPlugins_whenExecutorThrowsIOException_shouldThrowRuntimeException() throws IOException {
    when(executor.execute(getBaseCommand() + "list")).thenThrow(new IOException());
    assertThrows(RuntimeException.class, () -> pluginManager.listPlugins());
  }

  @Test
  void removePlugin_whenCommandSucceeds_shouldNotThrowException() throws IOException {
    when(executor.execute(getBaseCommand() + "remove my-plugin")).thenReturn(new CommandResult(0, "", ""));
    assertDoesNotThrow(() -> pluginManager.removePlugin("my-plugin"));
  }

  @Test
  void removePlugin_whenCommandFails_shouldThrowRuntimeException() throws IOException {
    when(executor.execute(getBaseCommand() + "remove my-plugin")).thenReturn(new CommandResult(1, "", "error"));
    assertThrows(RuntimeException.class, () -> pluginManager.removePlugin("my-plugin"));
  }

  @Test
  void removePlugin_whenExecutorThrowsIOException_shouldThrowRuntimeException() throws IOException {
    when(executor.execute(getBaseCommand() + "remove my-plugin")).thenThrow(new IOException());
    assertThrows(RuntimeException.class, () -> pluginManager.removePlugin("my-plugin"));
  }

  @Test
  void isPluginAvailable_whenSourceIsPluginName_shouldReturnTrue() {
    when(pluginSourceResolver.resolve("my-plugin", "1.0.0")).thenReturn("my-plugin");
    assertTrue(pluginManager.isPluginAvailable("my-plugin", "1.0.0"));
  }

  @Test
  void isPluginAvailable_whenVerificationSucceeds_shouldReturnTrue() {
    when(pluginSourceResolver.resolve("my-plugin", "1.0.0")).thenReturn("http://example.com/plugin.zip");
    when(pluginArtifactValidator.verifyPlugin("http://example.com/plugin.zip", "1.0.0")).thenReturn(true);
    assertTrue(pluginManager.isPluginAvailable("my-plugin", "1.0.0"));
  }

  @Test
  void isPluginAvailable_whenVerificationFails_shouldReturnFalse() {
    when(pluginSourceResolver.resolve("my-plugin", "1.0.0")).thenReturn("http://example.com/plugin.zip");
    when(pluginArtifactValidator.verifyPlugin("http://example.com/plugin.zip", "1.0.0")).thenReturn(false);
    assertFalse(pluginManager.isPluginAvailable("my-plugin", "1.0.0"));
  }

  @Test
  void installPlugin_whenCommandSucceeds_shouldNotThrowException() throws IOException {
    when(pluginSourceResolver.resolve("my-plugin", "1.0.0")).thenReturn("http://example.com/plugin.zip");
    when(executor.execute(getBaseCommand() + "install --batch http://example.com/plugin.zip")).thenReturn(new CommandResult(0, "", ""));
    assertDoesNotThrow(() -> pluginManager.installPlugin("my-plugin", "1.0.0"));
  }

  @Test
  void installPlugin_whenCommandFails_shouldThrowRuntimeException() throws IOException {
    when(pluginSourceResolver.resolve("my-plugin", "1.0.0")).thenReturn("http://example.com/plugin.zip");
    when(executor.execute(getBaseCommand() + "install --batch http://example.com/plugin.zip")).thenReturn(
        new CommandResult(1, "", "error"));
    assertThrows(RuntimeException.class, () -> pluginManager.installPlugin("my-plugin", "1.0.0"));
  }

  @Test
  void installPlugin_whenExecutorThrowsIOException_shouldThrowRuntimeException() throws IOException {
    when(pluginSourceResolver.resolve("my-plugin", "1.0.0")).thenReturn("http://example.com/plugin.zip");
    when(executor.execute(anyString())).thenThrow(new IOException());
    assertThrows(RuntimeException.class, () -> pluginManager.installPlugin("my-plugin", "1.0.0"));
  }
}

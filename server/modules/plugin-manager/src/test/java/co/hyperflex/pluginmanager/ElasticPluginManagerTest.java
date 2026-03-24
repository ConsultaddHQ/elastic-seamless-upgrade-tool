package co.hyperflex.pluginmanager;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
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

  private String getPluginDirectory() {
    return "/usr/share/elasticsearch/plugins/";
  }

  // --- LIST PLUGINS TESTS ---

  @Test
  void listPlugins_whenNoPluginsInstalled_shouldReturnEmptyList() throws IOException {
    // Blank stdout simulates an empty folder
    when(executor.execute("ls -1 " + getPluginDirectory())).thenReturn(new CommandResult(0, "", ""));
    List<String> plugins = pluginManager.listPlugins();
    assertTrue(plugins.isEmpty());
  }

  @Test
  void listPlugins_whenCommandFails_shouldReturnEmptyList() throws IOException {
    // If 'ls' fails (e.g., folder doesn't exist yet on a fresh node), it should gracefully return empty
    when(executor.execute("ls -1 " + getPluginDirectory())).thenReturn(new CommandResult(2, "", "No such file or directory"));
    List<String> plugins = pluginManager.listPlugins();
    assertTrue(plugins.isEmpty());
  }

  @Test
  void listPlugins_whenExecutorThrowsIOException_shouldThrowRuntimeException() throws IOException {
    when(executor.execute("ls -1 " + getPluginDirectory())).thenThrow(new IOException());
    assertThrows(RuntimeException.class, () -> pluginManager.listPlugins());
  }

  // --- REMOVE PLUGINS TESTS ---

  @Test
  void removePlugin_whenCommandSucceeds_shouldNotThrowException() throws IOException {
    when(executor.execute("rm -rf " + getPluginDirectory() + "my-plugin")).thenReturn(new CommandResult(0, "", ""));
    assertDoesNotThrow(() -> pluginManager.removePlugin("my-plugin"));
  }

  @Test
  void removePlugin_whenCommandFails_shouldThrowRuntimeException() throws IOException {
    when(executor.execute("rm -rf " + getPluginDirectory() + "my-plugin")).thenReturn(new CommandResult(1, "", "error"));
    assertThrows(RuntimeException.class, () -> pluginManager.removePlugin("my-plugin"));
  }

  @Test
  void removePlugin_whenExecutorThrowsIOException_shouldThrowRuntimeException() throws IOException {
    when(executor.execute("rm -rf " + getPluginDirectory() + "my-plugin")).thenThrow(new IOException());
    assertThrows(RuntimeException.class, () -> pluginManager.removePlugin("my-plugin"));
  }

  // --- IS PLUGIN AVAILABLE TESTS ---

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

  // --- INSTALL PLUGINS TESTS ---

  @Test
  void installPlugin_whenWgetDownloadFails_shouldThrowRuntimeException() throws IOException {
    String source = "http://example.com/plugin.zip";
    when(pluginSourceResolver.resolve("my-plugin", "1.0.0")).thenReturn(source);

    // Fail on the first step (wget)
    when(executor.execute("wget -q -O /tmp/my-plugin.zip " + source)).thenReturn(new CommandResult(1, "", "wget error"));

    assertThrows(RuntimeException.class, () -> pluginManager.installPlugin("my-plugin", "1.0.0"));
  }

  @Test
  void installPlugin_whenLocalInstallFails_shouldThrowRuntimeException() throws IOException {
    String source = "http://example.com/plugin.zip";
    when(pluginSourceResolver.resolve("my-plugin", "1.0.0")).thenReturn(source);

    // Succeed on wget, but fail on the elasticsearch-plugin tool
    when(executor.execute("wget -q -O /tmp/my-plugin.zip " + source)).thenReturn(new CommandResult(0, "", ""));
    when(executor.execute(getBaseCommand() + "install --batch file:///tmp/my-plugin.zip")).thenReturn(
        new CommandResult(1, "", "install error"));

    assertThrows(RuntimeException.class, () -> pluginManager.installPlugin("my-plugin", "1.0.0"));
  }

  @Test
  void installPlugin_whenExecutorThrowsIOException_shouldThrowRuntimeException() throws IOException {
    when(pluginSourceResolver.resolve("my-plugin", "1.0.0")).thenReturn("http://example.com/plugin.zip");
    when(executor.execute(anyString())).thenThrow(new IOException());
    assertThrows(RuntimeException.class, () -> pluginManager.installPlugin("my-plugin", "1.0.0"));
  }
}
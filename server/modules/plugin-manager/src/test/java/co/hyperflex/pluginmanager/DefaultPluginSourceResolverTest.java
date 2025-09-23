package co.hyperflex.pluginmanager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DefaultPluginSourceResolverTest {

  @Mock
  private PluginRegistry registry;

  @InjectMocks
  private DefaultPluginSourceResolver sourceResolver;

  @Test
  void resolve_forOfficialPlugin_shouldReturnPluginName() {
    when(registry.isOfficial("official-plugin")).thenReturn(true);
    String source = sourceResolver.resolve("official-plugin", "1.0.0");
    assertEquals("official-plugin", source);
  }

  @Test
  void resolve_forUnofficialPlugin_shouldReturnSourceFromRegistry() {
    when(registry.isOfficial("unofficial-plugin")).thenReturn(false);
    when(registry.getPluginSource("unofficial-plugin", "1.0.0")).thenReturn("http://example.com/plugin.zip");
    String source = sourceResolver.resolve("unofficial-plugin", "1.0.0");
    assertEquals("http://example.com/plugin.zip", source);
  }

  @Test
  void resolve_forUnknownPlugin_shouldThrowException() {
    when(registry.isOfficial("unknown-plugin")).thenReturn(false);
    when(registry.getPluginSource("unknown-plugin", "1.0.0")).thenReturn(null);
    assertThrows(IllegalArgumentException.class, () -> sourceResolver.resolve("unknown-plugin", "1.0.0"));
  }
}

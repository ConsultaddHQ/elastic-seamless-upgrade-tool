package co.hyperflex.pluginmanager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import co.hyperflex.pluginmanager.entities.PluginArtifactDescriptor;
import co.hyperflex.pluginmanager.repositories.PluginArtifactDescriptorRepository;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DefaultPluginRegistryTest {

  @Mock
  private PluginArtifactDescriptorRepository artifactDescriptorRepository;

  @InjectMocks
  private DefaultPluginRegistry defaultPluginRegistry;

  private PluginArtifactDescriptor officialPlugin;
  private PluginArtifactDescriptor unofficialPluginWithVersionSources;
  private PluginArtifactDescriptor unofficialPluginWithSourcePattern;

  @BeforeEach
  void setUp() {
    officialPlugin = new PluginArtifactDescriptor();
    officialPlugin.setName("official-plugin");
    officialPlugin.setOfficial(true);

    unofficialPluginWithVersionSources = new PluginArtifactDescriptor();
    unofficialPluginWithVersionSources.setName("unofficial-plugin-vs");
    unofficialPluginWithVersionSources.setOfficial(false);
    unofficialPluginWithVersionSources.setVersionSources(Map.of("1.0.0", "http://example.com/plugin-1.0.0.zip"));

    unofficialPluginWithSourcePattern = new PluginArtifactDescriptor();
    unofficialPluginWithSourcePattern.setName("unofficial-plugin-sp");
    unofficialPluginWithSourcePattern.setOfficial(false);
    unofficialPluginWithSourcePattern.setSourcePattern("http://example.com/plugin-$VERSION$.zip");
  }

  @Test
  void isOfficial_whenPluginIsOfficial_shouldReturnTrue() {
    when(artifactDescriptorRepository.findByName("official-plugin")).thenReturn(Optional.of(officialPlugin));
    assertTrue(defaultPluginRegistry.isOfficial("official-plugin"));
  }

  @Test
  void isOfficial_whenPluginIsNotOfficial_shouldReturnFalse() {
    when(artifactDescriptorRepository.findByName("unofficial-plugin-vs")).thenReturn(Optional.of(unofficialPluginWithVersionSources));
    assertFalse(defaultPluginRegistry.isOfficial("unofficial-plugin-vs"));
  }

  @Test
  void isOfficial_whenPluginNotFound_shouldThrowException() {
    when(artifactDescriptorRepository.findByName("unknown-plugin")).thenReturn(Optional.empty());
    assertThrows(Exception.class, () -> defaultPluginRegistry.isOfficial("unknown-plugin"));
  }

  @Test
  void getPluginSource_forOfficialPlugin_shouldReturnPluginName() {
    when(artifactDescriptorRepository.findByName("official-plugin")).thenReturn(Optional.of(officialPlugin));
    String source = defaultPluginRegistry.getPluginSource("official-plugin", "1.0.0");
    assertEquals("official-plugin", source);
  }

  @Test
  void getPluginSource_forUnofficialPluginWithVersionSource_shouldReturnSource() {
    when(artifactDescriptorRepository.findByName("unofficial-plugin-vs")).thenReturn(Optional.of(unofficialPluginWithVersionSources));
    String source = defaultPluginRegistry.getPluginSource("unofficial-plugin-vs", "1.0.0");
    assertEquals("http://example.com/plugin-1.0.0.zip", source);
  }

  @Test
  void getPluginSource_forUnofficialPluginWithSourcePattern_shouldReturnFormattedSource() {
    when(artifactDescriptorRepository.findByName("unofficial-plugin-sp")).thenReturn(Optional.of(unofficialPluginWithSourcePattern));
    String source = defaultPluginRegistry.getPluginSource("unofficial-plugin-sp", "2.0.0");
    assertEquals("http://example.com/plugin-2.0.0.zip", source);
  }

  @Test
  void getPluginSource_forUnofficialPluginWithNoMatchingVersion_andNoPattern_shouldReturnNull() {
    when(artifactDescriptorRepository.findByName("unofficial-plugin-vs")).thenReturn(Optional.of(unofficialPluginWithVersionSources));
    String source = defaultPluginRegistry.getPluginSource("unofficial-plugin-vs", "2.0.0");
    assertNull(source);
  }

  @Test
  void getPluginSource_forUnofficialPluginWithNoMatchingVersion_andWithPattern_shouldReturnPattern() {
    unofficialPluginWithVersionSources.setSourcePattern("http://example.com/plugin-$VERSION$.zip");
    when(artifactDescriptorRepository.findByName("unofficial-plugin-vs")).thenReturn(Optional.of(unofficialPluginWithVersionSources));
    String source = defaultPluginRegistry.getPluginSource("unofficial-plugin-vs", "2.0.0");
    assertEquals("http://example.com/plugin-2.0.0.zip", source);
  }

  @Test
  void getPluginSource_whenPluginNotFound_shouldReturnNull() {
    when(artifactDescriptorRepository.findByName("unofficial-plugin-vs")).thenReturn(Optional.of(unofficialPluginWithVersionSources));
    String source = defaultPluginRegistry.getPluginSource("unofficial-plugin-vs", "2.0.0");
    assertNull(source);
  }
}

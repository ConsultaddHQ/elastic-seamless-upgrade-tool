package co.hyperflex.pluginmanager.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import co.hyperflex.common.exceptions.NotFoundException;
import co.hyperflex.pluginmanager.entities.PluginArtifactDescriptor;
import co.hyperflex.pluginmanager.repositories.PluginArtifactDescriptorRepository;
import co.hyperflex.pluginmanager.services.dtos.AddPluginArtifactDescriptorRequest;
import co.hyperflex.pluginmanager.services.dtos.UpdatePluginVersionSourceRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PluginArtifactDescriptorServiceTest {

  @Mock
  private PluginArtifactDescriptorRepository artifactDescriptorRepository;

  @InjectMocks
  private PluginArtifactDescriptorService service;

  private PluginArtifactDescriptor descriptor;

  @BeforeEach
  void setUp() {
    descriptor = new PluginArtifactDescriptor();
    descriptor.setId("my-plugin");
    descriptor.setName("my-plugin");
    descriptor.setOfficial(false);
    var versionSources = new HashMap<String, String>();
    versionSources.put("2.0", "new-source");
    descriptor.setVersionSources(versionSources);
  }

  @Test
  void getAll_shouldReturnAllDescriptors() {
    when(artifactDescriptorRepository.findAll()).thenReturn(List.of(descriptor));
    List<PluginArtifactDescriptor> result = service.getAll();
    assertEquals(1, result.size());
    assertEquals("my-plugin", result.get(0).getName());
  }

  @Test
  void addPluginArtifactDescriptor_shouldSaveDescriptor() {
    AddPluginArtifactDescriptorRequest request = new AddPluginArtifactDescriptorRequest(
        "new-plugin", true, "pattern", Map.of("1.0", "source")
    );

    service.addPluginArtifactDescriptor(request);

    ArgumentCaptor<PluginArtifactDescriptor> captor = ArgumentCaptor.forClass(PluginArtifactDescriptor.class);
    verify(artifactDescriptorRepository).save(captor.capture());

    PluginArtifactDescriptor saved = captor.getValue();
    assertEquals("new-plugin", saved.getName());
    assertEquals("new-plugin", saved.getId());
    assertTrue(saved.isOfficial());
    assertEquals("pattern", saved.getSourcePattern());
    assertEquals("source", saved.getVersionSources().get("1.0"));
  }

  @Test
  void updatePluginArtifactDescriptor_whenDescriptorExists_shouldUpdateAndSave() {
    when(artifactDescriptorRepository.findById("my-plugin")).thenReturn(Optional.of(descriptor));
    UpdatePluginVersionSourceRequest request = new UpdatePluginVersionSourceRequest("2.0", "new-source");

    service.updatePluginArtifactDescriptor("my-plugin", request);

    ArgumentCaptor<PluginArtifactDescriptor> captor = ArgumentCaptor.forClass(PluginArtifactDescriptor.class);
    verify(artifactDescriptorRepository).save(captor.capture());

    PluginArtifactDescriptor saved = captor.getValue();
    assertEquals("new-source", saved.getVersionSources().get("2.0"));
  }

  @Test
  void updatePluginArtifactDescriptor_whenDescriptorNotFound_shouldThrowException() {
    when(artifactDescriptorRepository.findById("unknown")).thenReturn(Optional.empty());
    UpdatePluginVersionSourceRequest request = new UpdatePluginVersionSourceRequest("2.0", "new-source");
    assertThrows(Exception.class, () -> service.updatePluginArtifactDescriptor("unknown", request));
  }

  @Test
  void getByName_whenDescriptorExists_shouldReturnDescriptor() {
    when(artifactDescriptorRepository.findById("my-plugin")).thenReturn(Optional.of(descriptor));
    PluginArtifactDescriptor result = service.getByName("my-plugin");
    assertEquals("my-plugin", result.getName());
  }

  @Test
  void getByName_whenDescriptorNotFound_shouldThrowNotFoundException() {
    when(artifactDescriptorRepository.findById("unknown")).thenReturn(Optional.empty());
    assertThrows(NotFoundException.class, () -> service.getByName("unknown"));
  }
}

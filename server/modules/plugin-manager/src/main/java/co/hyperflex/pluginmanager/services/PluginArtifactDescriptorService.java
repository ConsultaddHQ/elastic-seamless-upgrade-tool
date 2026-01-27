package co.hyperflex.pluginmanager.services;

import co.hyperflex.core.exceptions.NotFoundException;
import co.hyperflex.pluginmanager.entities.PluginArtifactDescriptor;
import co.hyperflex.pluginmanager.repositories.PluginArtifactDescriptorRepository;
import co.hyperflex.pluginmanager.services.dtos.AddPluginArtifactDescriptorRequest;
import co.hyperflex.pluginmanager.services.dtos.AddPluginArtifactDescriptorResponse;
import co.hyperflex.pluginmanager.services.dtos.UpdatePluginVersionSourceRequest;
import co.hyperflex.pluginmanager.services.dtos.UpdatePluginVersionSourceResponse;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PluginArtifactDescriptorService {
  private final PluginArtifactDescriptorRepository artifactDescriptorRepository;

  public PluginArtifactDescriptorService(PluginArtifactDescriptorRepository artifactDescriptorRepository) {
    this.artifactDescriptorRepository = artifactDescriptorRepository;
  }

  public List<PluginArtifactDescriptor> getAll() {
    return artifactDescriptorRepository.findAll();
  }

  public AddPluginArtifactDescriptorResponse addPluginArtifactDescriptor(AddPluginArtifactDescriptorRequest request) {
    PluginArtifactDescriptor descriptor = new PluginArtifactDescriptor();
    descriptor.setId(request.name());
    descriptor.setName(request.name());
    descriptor.setOfficial(request.isOfficial());
    if (request.versionSources() != null) {
      descriptor.setVersionSources(request.versionSources());
    }
    descriptor.setSourcePattern(request.sourcePattern());
    artifactDescriptorRepository.save(descriptor);
    return new AddPluginArtifactDescriptorResponse("Plugin added successfully");
  }

  public UpdatePluginVersionSourceResponse updatePluginArtifactDescriptor(String name, UpdatePluginVersionSourceRequest request) {
    PluginArtifactDescriptor descriptor = artifactDescriptorRepository.findById(name).orElseThrow();
    descriptor.getVersionSources().put(request.version(), request.source());
    artifactDescriptorRepository.save(descriptor);
    return new UpdatePluginVersionSourceResponse("Plugin source updated successfully");
  }

  public PluginArtifactDescriptor getByName(String pluginName) {
    return artifactDescriptorRepository.findById(pluginName).orElseThrow(() -> new NotFoundException("Plugin info not found"));
  }
}

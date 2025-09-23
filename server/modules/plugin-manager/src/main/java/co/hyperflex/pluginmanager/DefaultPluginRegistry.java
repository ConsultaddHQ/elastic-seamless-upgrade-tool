package co.hyperflex.pluginmanager;

import co.hyperflex.pluginmanager.entities.PluginArtifactDescriptor;
import co.hyperflex.pluginmanager.repositories.PluginArtifactDescriptorRepository;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Component;

@Component
public class DefaultPluginRegistry implements PluginRegistry {
  private final PluginArtifactDescriptorRepository artifactDescriptorRepositories;

  public DefaultPluginRegistry(PluginArtifactDescriptorRepository artifactDescriptorRepositories) {
    this.artifactDescriptorRepositories = artifactDescriptorRepositories;
  }

  @Override
  public boolean isOfficial(String pluginName) {
    var pluginArtifactDescriptor = artifactDescriptorRepositories.findByName(pluginName);
    return pluginArtifactDescriptor.map(PluginArtifactDescriptor::isOfficial)
        .orElseThrow();
  }

  @Nullable
  @Override
  public String getPluginSource(@NotNull String pluginName, @NotNull String version) {
    if (isOfficial(pluginName)) {
      return pluginName;
    }
    var artifactDescriptorOptional = artifactDescriptorRepositories.findByName(pluginName);
    if (artifactDescriptorOptional.isPresent()) {
      var descriptor = artifactDescriptorOptional.get();
      var source = descriptor.getVersionSources().get(version);
      if (source != null) {
        return source;
      } else {
        if (descriptor.getSourcePattern() != null) {
          return descriptor.getSourcePattern().replace("$VERSION$", version);
        }
        return null;
      }
    } else {
      return null;
    }
  }
}
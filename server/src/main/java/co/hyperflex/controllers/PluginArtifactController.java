package co.hyperflex.controllers;

import co.hyperflex.pluginmanager.entities.PluginArtifactDescriptor;
import co.hyperflex.pluginmanager.services.PluginArtifactDescriptorService;
import co.hyperflex.pluginmanager.services.dtos.AddPluginArtifactDescriptorRequest;
import co.hyperflex.pluginmanager.services.dtos.AddPluginArtifactDescriptorResponse;
import co.hyperflex.pluginmanager.services.dtos.UpdatePluginVersionSourceRequest;
import co.hyperflex.pluginmanager.services.dtos.UpdatePluginVersionSourceResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/plugin-artifacts")
public class PluginArtifactController {
  private final PluginArtifactDescriptorService pluginArtifactDescriptorService;

  public PluginArtifactController(PluginArtifactDescriptorService pluginArtifactDescriptorService) {
    this.pluginArtifactDescriptorService = pluginArtifactDescriptorService;
  }

  @GetMapping
  List<PluginArtifactDescriptor> getAll() {
    return pluginArtifactDescriptorService.getAll();
  }

  @GetMapping("/{pluginName}")
  PluginArtifactDescriptor getPluginArtifactDescriptor(@PathVariable String pluginName) {
    return pluginArtifactDescriptorService.getByName(pluginName);
  }

  @PostMapping
  public AddPluginArtifactDescriptorResponse addPluginArtifactDescriptor(@RequestBody @Valid AddPluginArtifactDescriptorRequest request) {
    return pluginArtifactDescriptorService.addPluginArtifactDescriptor(request);
  }

  @PutMapping("/{pluginName}")
  public UpdatePluginVersionSourceResponse updatePluginVersionSource(UpdatePluginVersionSourceRequest request,
                                                                     @PathVariable String pluginName) {
    return pluginArtifactDescriptorService.updatePluginArtifactDescriptor(pluginName, request);
  }
}

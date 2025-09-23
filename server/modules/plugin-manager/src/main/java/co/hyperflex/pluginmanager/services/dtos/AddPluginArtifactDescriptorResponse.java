package co.hyperflex.pluginmanager.services.dtos;

import jakarta.validation.constraints.NotNull;

public record AddPluginArtifactDescriptorResponse(
    @NotNull String message) {
}

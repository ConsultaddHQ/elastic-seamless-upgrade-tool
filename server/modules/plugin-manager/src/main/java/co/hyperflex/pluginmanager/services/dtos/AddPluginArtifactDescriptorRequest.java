package co.hyperflex.pluginmanager.services.dtos;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotEmpty;
import java.util.Map;

public record AddPluginArtifactDescriptorRequest(
    @NotEmpty String name,
    boolean isOfficial,
    @Nullable String sourcePattern,
    @Nullable Map<String, String> versionSources) {
}

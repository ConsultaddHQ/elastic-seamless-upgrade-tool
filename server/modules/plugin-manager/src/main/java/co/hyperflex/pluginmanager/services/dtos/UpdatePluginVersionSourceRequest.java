package co.hyperflex.pluginmanager.services.dtos;

import jakarta.validation.constraints.NotEmpty;

public record UpdatePluginVersionSourceRequest(
    @NotEmpty String version,
    @NotEmpty String source
) {
}

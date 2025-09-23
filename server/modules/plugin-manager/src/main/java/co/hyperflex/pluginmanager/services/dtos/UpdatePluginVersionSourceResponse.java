package co.hyperflex.pluginmanager.services.dtos;

import jakarta.validation.constraints.NotEmpty;

public record UpdatePluginVersionSourceResponse(
    @NotEmpty String message
) {
}

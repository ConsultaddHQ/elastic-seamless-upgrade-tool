package co.hyperflex.common.client;

import jakarta.validation.constraints.NotNull;

public record ClientConnectionDetail(
    @NotNull String baseUrl,
    @NotNull String secretKey
) {
}

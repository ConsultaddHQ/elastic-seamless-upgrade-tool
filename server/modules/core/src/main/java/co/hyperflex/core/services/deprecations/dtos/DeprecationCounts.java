package co.hyperflex.core.services.deprecations.dtos;

public record DeprecationCounts(
    int critical,
    int warning
) {
}

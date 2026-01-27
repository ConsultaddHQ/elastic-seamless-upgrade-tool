package co.hyperflex.breakingchanges.services.deprecations.dtos;

public record DeprecationCounts(
    int critical,
    int warning
) {
}

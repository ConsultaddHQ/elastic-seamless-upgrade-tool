package co.hyperflex.core.services.clusters.dtos;

public record GetClusterKibanaNodeResponse(
    String id,
    String name,
    String ip
) {
}

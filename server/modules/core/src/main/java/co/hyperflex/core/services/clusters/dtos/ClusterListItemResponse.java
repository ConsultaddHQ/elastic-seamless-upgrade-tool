package co.hyperflex.core.services.clusters.dtos;

public record ClusterListItemResponse(
    String id,
    String name,
    String type,
    String typeDisplayName,
    String version,
    String status
) {
}

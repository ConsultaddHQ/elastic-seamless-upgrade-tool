package co.hyperflex.core.services.clusters.dtos;

public record ClusterOverviewResponse(
    String clusterName,
    String clusterUUID,
    String status,
    String version,
    boolean timedOut,
    int numberOfDataNodes,
    int numberOfNodes,
    int numberOfMasterNodes,
    String currentMasterNode,
    Boolean adaptiveReplicationEnabled,
    int totalIndices,
    int activePrimaryShards,
    int activeShards,
    int unassignedShards,
    int initializingShards,
    int relocatingShards,
    String infrastructureType
) {
}
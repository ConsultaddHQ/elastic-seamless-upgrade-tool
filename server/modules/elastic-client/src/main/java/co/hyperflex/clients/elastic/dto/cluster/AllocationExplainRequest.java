package co.hyperflex.clients.elastic.dto.cluster;

public record AllocationExplainRequest(
    String index, int shard, boolean primary
) {
}

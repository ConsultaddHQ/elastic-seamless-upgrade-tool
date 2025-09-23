package co.hyperflex.clients.elastic.dto;

public record GetAllocationExplanationResponse(
    String index,
    String shard,
    String explanation) {
}

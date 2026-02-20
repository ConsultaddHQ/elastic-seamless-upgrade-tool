package co.hyperflex.clients.elastic.dto;

import java.util.List;

public record GetAllocationExplanationResponse(
    String index,
    String shard,
    String explanation,
    List<String> fullExplanation
) {
}

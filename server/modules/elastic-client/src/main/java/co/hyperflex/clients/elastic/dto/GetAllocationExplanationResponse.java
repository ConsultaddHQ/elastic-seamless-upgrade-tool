package co.hyperflex.clients.elastic.dto;

import java.util.List;
import java.util.Set;

public record GetAllocationExplanationResponse(
    String index,
    String shard,
    String explanation,
    Set<String> decidersSet, // List of node_allocation_decisions/deciders/decider
    List<String> fullExplanation // List of node_allocation_decisions/deciders/explanation
) {
}

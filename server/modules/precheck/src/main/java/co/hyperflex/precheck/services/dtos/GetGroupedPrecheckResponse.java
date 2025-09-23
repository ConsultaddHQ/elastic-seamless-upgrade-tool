package co.hyperflex.precheck.services.dtos;

import java.util.List;

public record GetGroupedPrecheckResponse(
    List<GetNodePrecheckGroup> node,
    List<GetPrecheckEntry> cluster,
    List<GetIndexPrecheckGroup> index
) {
}

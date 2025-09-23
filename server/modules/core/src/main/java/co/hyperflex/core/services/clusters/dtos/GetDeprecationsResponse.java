package co.hyperflex.core.services.clusters.dtos;

import java.util.List;

public record GetDeprecationsResponse(
    String issue,
    String issueDetails,
    String type,
    List<String> resolutions
) {
}

package co.hyperflex.breakingchanges.services.deprecations.dtos;

import java.util.List;

public record GetDeprecationsResponse(
    String issue,
    String issueDetails,
    String type,
    List<String> resolutions
) {
}

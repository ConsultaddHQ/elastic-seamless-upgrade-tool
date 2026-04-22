package co.hyperflex.upgrade.services.dtos;

public record IndexReindexInfo(
    String index,
    String size,
    String docsCount,
    String storageTier,
    boolean systemIndex,
    String estimateSummary,
    String estimateTime
) {
}
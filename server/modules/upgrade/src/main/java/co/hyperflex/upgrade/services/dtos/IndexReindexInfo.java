package co.hyperflex.upgrade.services.dtos;

public record IndexReindexInfo(
    String index,
    String size,
    String docsCount,
    String storageTier,
    boolean systemIndex,
    boolean dataStream,
    String estimateSummary,
    String estimateTime,
    ReindexProgressInfo progress
) {
}
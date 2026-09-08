package co.hyperflex.upgrade.services.dtos;

public record ReindexProgressInfo(
    boolean isReindexing,
    String taskId,
    int progressPercentage,
    long remainingDocs
) {
}
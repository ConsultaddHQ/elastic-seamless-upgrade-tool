package co.hyperflex.upgrade.services.dtos;

public record ReindexStatus(
    boolean possible,
    String reason
) {
}
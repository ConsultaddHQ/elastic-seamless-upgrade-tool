package co.hyperflex.precheck.services.dtos;

public record GetPrecheckSummaryResponse(long critical, long warning, long skipped) {
}

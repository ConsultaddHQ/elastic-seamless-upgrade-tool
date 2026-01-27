package co.hyperflex.precheck.services.dtos;

import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import co.hyperflex.precheck.core.enums.PrecheckStatus;
import java.util.List;

public record GetPrecheckEntry(
    String id,
    String name,
    PrecheckStatus status,
    PrecheckSeverity severity,
    List<String> logs,
    String duration,
    boolean skippable) {
}

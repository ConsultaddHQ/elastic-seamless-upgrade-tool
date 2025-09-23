package co.hyperflex.precheck.repositories.projection;

import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import co.hyperflex.precheck.core.enums.PrecheckStatus;

public record PrecheckStatusAndSeverityView(PrecheckStatus status, PrecheckSeverity severity) {
}

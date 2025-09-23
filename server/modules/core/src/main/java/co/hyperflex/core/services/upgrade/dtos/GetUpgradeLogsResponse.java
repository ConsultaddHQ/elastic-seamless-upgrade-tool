package co.hyperflex.core.services.upgrade.dtos;

import java.util.List;

public record GetUpgradeLogsResponse(
    List<String> logs
) {
}

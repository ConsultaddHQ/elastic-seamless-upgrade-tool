package co.hyperflex.upgrade.services;

import co.hyperflex.core.services.upgrade.dtos.GetUpgradeLogsRequest;
import co.hyperflex.core.services.upgrade.dtos.GetUpgradeLogsResponse;

public interface UpgradeLogService {
  void addLog(String jobId, String nodeId, String message);

  GetUpgradeLogsResponse getLogs(GetUpgradeLogsRequest request);
}

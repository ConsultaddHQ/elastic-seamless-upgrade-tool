package co.hyperflex.upgrade.logger;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;
import co.hyperflex.upgrade.entities.UpgradeLogEntity;
import co.hyperflex.upgrade.services.UpgradeLogService;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

@Component
public class UpdateContextAwareAppender extends AppenderBase<ILoggingEvent> {
  private final UpgradeLogService upgradeLogService;

  public UpdateContextAwareAppender(UpgradeLogService upgradeLogService) {
    this.upgradeLogService = upgradeLogService;
  }

  @Override
  protected void append(ILoggingEvent eventObject) {
    String nodeId = MDC.get(UpgradeLogEntity.NODE_ID);
    String clusterUpgradeJobId = MDC.get(UpgradeLogEntity.CLUSTER_UPGRADE_JOB_ID);
    String message = eventObject.getFormattedMessage();
    upgradeLogService.addLog(clusterUpgradeJobId, nodeId, message);
  }
}
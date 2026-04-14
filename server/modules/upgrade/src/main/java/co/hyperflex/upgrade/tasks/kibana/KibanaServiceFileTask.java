package co.hyperflex.upgrade.tasks.kibana;

import co.hyperflex.ansible.commands.AnsibleAdHocCommand;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.upgrade.tasks.AbstractAnsibleTask;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.util.Map;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class KibanaServiceFileTask extends AbstractAnsibleTask {

  private static final String SRC_PATH = "/etc/systemd/system/kibana.service";
  private static final String DEST_PATH = "/etc/systemd/system/kibana.service.7x_backup";
  private final ClusterUpgradeJobEntity clusterUpgradeJobEntity;

  public KibanaServiceFileTask(ClusterUpgradeJobEntity clusterUpgradeJobEntity) {
    this.clusterUpgradeJobEntity = clusterUpgradeJobEntity;
  }

  @Override
  public String getName() {
    return "Legacy 7.x Kibana Service File Rename Task";
  }

  @Override
  public TaskResult run(Context context) {
    final Logger logger = context.logger();

    String currentVersion = clusterUpgradeJobEntity.getCurrentVersion();
    String targetVersion = clusterUpgradeJobEntity.getTargetVersion();

    boolean isFrom7 = currentVersion.startsWith("7.");
    boolean isTo8 = targetVersion.startsWith("8.");

    if (!(isFrom7 && isTo8)) {
      logger.info("Skipping task: This cleanup is only required for 7.x to 8.x upgrades.");
      return TaskResult.success("Skipped due to version mismatch");
    }

    logger.info("Imp: Checking for legacy 7.x systemd service file at /etc/systemd/system/kibana.service.");
    logger.info("Imp: If present, it will be safely renamed to prevent systemd conflicts during the 8.x boot sequence.");

    String archiveScript = String.format(
        "if [ -f %1$s ]; then " +
            "  sudo mv %1$s %2$s && " +
            "  sudo systemctl daemon-reload && " +
            "  echo 'Legacy file found and successfully archived.'; " +
            "else " +
            "  echo 'No legacy file found. Skipping archive step.'; " +
            "fi",
        SRC_PATH, DEST_PATH
    );

    AnsibleAdHocCommand command = AnsibleAdHocCommand.builder()
        .module("shell")
        .args(Map.of(
            "cmd", archiveScript,
            "executable", "/bin/bash"
        ))
        .build();

    logger.debug("Executing Ansible command: {}", archiveScript);
    TaskResult result = runAdHocCommand(command, context);

    if (result.success()) {
      logger.info("Legacy 7.x Kibana service file found and successfully rename!");
    } else {
      logger.error("Failed to process legacy service file. Error: {}", result.message());
    }

    return result;
  }


}
package co.hyperflex.upgrade.tasks.kibana;

import co.hyperflex.ansible.commands.AnsibleAdHocCommand;
import co.hyperflex.upgrade.tasks.AbstractAnsibleTask;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.util.Map;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class BackupKibanaServiceFileTask extends AbstractAnsibleTask {

  @Override
  public String getName() {
    return "Backup legacy 7.x Kibana systemd override";
  }

  @Override
  public TaskResult run(Context context) {
    final Logger logger = context.logger();

    logger.info("Imp: Checking for legacy 7.x systemd service file at /etc/systemd/system/kibana.service...");
    logger.info("Imp: If present, it will be safely renamed to prevent systemd conflicts during the 8.x boot sequence.");

    String archiveScript =
        "test -f /etc/systemd/system/kibana.service && "
            + "mv /etc/systemd/system/kibana.service /etc/systemd/system/kibana.service.7x_backup && "
            + "systemctl daemon-reload && "
            + "echo 'Legacy file found and successfully archived.' || "
            + "echo 'No legacy file found. Skipping archive step.'";

    AnsibleAdHocCommand command = AnsibleAdHocCommand.builder()
        .module("shell")
        .args(Map.of(
            "cmd", archiveScript,
            "executable", "/bin/bash"
        ))
        .build();

    return runAdHocCommand(command, context);
  }
}
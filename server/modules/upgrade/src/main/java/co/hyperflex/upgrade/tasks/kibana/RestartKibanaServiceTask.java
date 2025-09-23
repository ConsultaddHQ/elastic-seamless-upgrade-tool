package co.hyperflex.upgrade.tasks.kibana;

import co.hyperflex.ansible.commands.AnsibleAdHocCommand;
import co.hyperflex.upgrade.tasks.AbstractAnsibleTask;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class RestartKibanaServiceTask extends AbstractAnsibleTask {

  @Override
  public String getName() {
    return "Restart kibana service";
  }

  @Override
  public TaskResult run(Context context) {
    var cmd = AnsibleAdHocCommand.builder()
        .systemd()
        .args(Map.of(
            "name", "kibana",
            "state", "restarted",
            "daemon_reload", "yes")
        )
        .build();
    return runAdHocCommand(cmd, context);
  }
}

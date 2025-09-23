package co.hyperflex.upgrade.tasks.kibana;

import co.hyperflex.ansible.commands.AnsibleAdHocCommand;
import co.hyperflex.upgrade.tasks.AbstractAnsibleTask;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class StartKibanaServiceTask extends AbstractAnsibleTask {

  @Override
  public String getName() {
    return "Start kibana service";
  }

  @Override
  public TaskResult run(Context context) {
    context.logger().info("Starting Kibana service task");
    var cmd = AnsibleAdHocCommand.builder()
        .systemd()
        .args(Map.of(
            "name", "kibana",
            "state", "started",
            "daemon_reload", "yes")
        )
        .build();
    return runAdHocCommand(cmd, context);
  }
}

package co.hyperflex.upgrade.tasks.kibana;

import co.hyperflex.ansible.commands.AnsibleAdHocCommand;
import co.hyperflex.upgrade.tasks.AbstractAnsibleTask;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class UpdateKibanaTask extends AbstractAnsibleTask {

  @Override
  public String getName() {
    return "Update kibana service";
  }

  @Override
  public TaskResult run(Context context) {
    AnsibleAdHocCommand command = switch (context.node().getOs().packageManager()) {
      case APT -> AnsibleAdHocCommand.builder()
          .apt()
          .args(Map.of(
              "name", "kibana=" + context.config().targetVersion(),
              "state", "present")
          )
          .build();
      case DNF -> AnsibleAdHocCommand.builder()
          .dnf()
          .args(Map.of(
              "name", "kibana-" + context.config().targetVersion(),
              "state", "present"
          ))
          .build();
      case YUM -> AnsibleAdHocCommand.builder()
          .yum()
          .args(Map.of(
              "name", "kibana-" + context.config().targetVersion(),
              "state", "present"
          ))
          .build();
      case null, default -> throw new IllegalStateException("Unsupported package manager " + context.node().getOs().packageManager());
    };
    return runAdHocCommand(command, context);
  }
}

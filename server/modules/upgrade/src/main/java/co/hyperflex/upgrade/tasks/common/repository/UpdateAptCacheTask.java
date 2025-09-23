package co.hyperflex.upgrade.tasks.common.repository;

import co.hyperflex.ansible.commands.AnsibleAdHocCommand;
import co.hyperflex.upgrade.tasks.AbstractAnsibleTask;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class UpdateAptCacheTask extends AbstractAnsibleTask {
  @Override
  public String getName() {
    return "Update apt-cache";
  }

  @Override
  public TaskResult run(Context context) {
    var command = switch (context.node().getOs().packageManager()) {
      case APT -> AnsibleAdHocCommand.builder()
          .module("ansible.builtin.apt")
          .args(Map.of(
              "update_cache", "yes"
          ))
          .build();
      case null, default -> null;
    };
    if (command == null) {
      return TaskResult.success("[Skipped] No prerequisites needed");
    }
    return runAdHocCommand(command, context);
  }
}

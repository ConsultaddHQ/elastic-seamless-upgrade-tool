package co.hyperflex.upgrade.tasks;

import co.hyperflex.ansible.commands.AnsibleAdHocCommand;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AddRepositoryTask extends AbstractAnsibleTask {

  @Override
  public String getName() {
    return "Add v8 repository";
  }

  @Override
  public TaskResult run(Context context) {
    AnsibleAdHocCommand command = switch (context.node().getOs().packageManager()) {
      case APT -> AnsibleAdHocCommand.builder()
          .aptRepository()
          .args(Map.of(
              "repo",
              "'deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main'",
              "state", "present",
              "filename", "elastic-8.x"
          ))
          .build();

      case null, default -> throw new IllegalStateException(
          "Unsupported package manager " + context.node().getOs().packageManager()
      );
    };
    return runAdHocCommand(command, context);
  }
}
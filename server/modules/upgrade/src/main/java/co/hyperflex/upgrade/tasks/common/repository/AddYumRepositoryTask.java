package co.hyperflex.upgrade.tasks.common.repository;

import static co.hyperflex.upgrade.tasks.common.repository.AddRepositoryTask.GPG_KEY_URL;

import co.hyperflex.ansible.commands.AnsibleAdHocCommand;
import co.hyperflex.upgrade.tasks.AbstractAnsibleTask;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AddYumRepositoryTask extends AbstractAnsibleTask {


  @Override
  public String getName() {
    return "Setup Elasticsearch yum repository (8.x or 9.x)";
  }

  @Override
  public TaskResult run(Context context) {
    String targetVersion = context.config().targetVersion();

    String baseUrl = getRepositoryUrl(targetVersion);
    String description = String.format("Elasticsearch repository for %s packages",
        targetVersion.startsWith("8") ? "8.x" : "9.x");

    var command = AnsibleAdHocCommand.builder()
        .yumRepository()
        .args(Map.of(
            "name", "elasticsearch",
            "description", "'" + description + "'",
            "baseurl", baseUrl,
            "gpgcheck", "1",
            "gpgkey", GPG_KEY_URL,
            "enabled", "1",
            "state", "present"
        ))
        .build();

    return runAdHocCommand(command, context);
  }

  private String getRepositoryUrl(String version) {
    if (version.startsWith("8")) {
      return "https://artifacts.elastic.co/packages/8.x/yum";
    } else if (version.startsWith("9")) {
      return "https://artifacts.elastic.co/packages/9.x/yum";
    }
    throw new IllegalArgumentException("Unsupported Elasticsearch version: " + version);
  }
}

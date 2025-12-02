package co.hyperflex.upgrade.tasks.common.repository;

import static co.hyperflex.upgrade.tasks.common.repository.AddRepositoryTask.GPG_KEY_URL;

import co.hyperflex.ansible.commands.AnsibleAdHocCommand;
import co.hyperflex.upgrade.tasks.AbstractAnsibleTask;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AddAptRepositoryTask extends AbstractAnsibleTask {

  private static final String KEYRING_PATH = "/usr/share/keyrings/elasticsearch-keyring.gpg";
  private static final String TEMP_GPG_KEY = "/tmp/GPG-KEY-elasticsearch";
  private static final String MODULE_GET_URL = "ansible.builtin.get_url";
  private static final String MODULE_COMMAND = "ansible.builtin.command";

  @Override
  public String getName() {
    return "Setup Elasticsearch apt repository (8.x or 9.x)";
  }

  @Override
  public TaskResult run(Context context) {
    var targetVersion = context.config().targetVersion();

    // Ensure GPG key is downloaded and converted
    var gpgKeyResult = setupGpgKey(context);
    if (gpgKeyResult != null) {
      return gpgKeyResult;
    }

    var repo = buildRepositoryEntry(targetVersion);
    var command = AnsibleAdHocCommand.builder()
        .aptRepository()
        .args(Map.of(
            "repo", repo,
            "state", "present",
            "filename", "elastic-" + getMajorVersion(targetVersion)
        ))
        .build();

    return runAdHocCommand(command, context);
  }

  private String buildRepositoryEntry(String version) {
    String majorVersion = getMajorVersion(version);
    return String.format(
        "'deb [signed-by=%s] https://artifacts.elastic.co/packages/%s.x/apt stable main'",
        KEYRING_PATH, majorVersion
    );
  }

  private String getMajorVersion(String version) {
    if (version == null || version.isEmpty()) {
      throw new IllegalArgumentException("Target version must not be null or empty");
    }
    return String.valueOf(version.charAt(0));
  }

  private TaskResult setupGpgKey(Context context) {
    // Step 1: Download GPG key
    var downloadKey = AnsibleAdHocCommand.builder()
        .module(MODULE_GET_URL)
        .args(Map.of(
            "url", GPG_KEY_URL,
            "dest", TEMP_GPG_KEY,
            "mode", "0644"
        ))
        .build();
    var downloadResult = runAdHocCommand(downloadKey, context);
    if (!downloadResult.success()) {
      return downloadResult;
    }

    // Step 2: Convert GPG key
    var convertKey = AnsibleAdHocCommand.builder()
        .module(MODULE_COMMAND)
        .args(List.of(String.format(
            "gpg --batch --yes --dearmor -o %s %s",
            KEYRING_PATH, TEMP_GPG_KEY)
        ))
        .build();
    var convertResult = runAdHocCommand(convertKey, context);
    if (!convertResult.success()) {
      return convertResult;
    }

    return null;
  }
}

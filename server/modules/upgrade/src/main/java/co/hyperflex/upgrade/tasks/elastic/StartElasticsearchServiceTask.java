package co.hyperflex.upgrade.tasks.elastic;

import co.hyperflex.ansible.commands.AnsibleAdHocCommand;
import co.hyperflex.upgrade.tasks.AbstractAnsibleTask;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class StartElasticsearchServiceTask extends AbstractAnsibleTask {

  @Override
  public String getName() {
    return "Start Elasticsearch Service";
  }

  @Override
  public TaskResult run(Context context) {
    var cmd = AnsibleAdHocCommand.builder()
        .systemd()
        .args(Map.of("name", "elasticsearch", "state", "started"))
        .build();
    return runAdHocCommand(cmd, context);
  }
}
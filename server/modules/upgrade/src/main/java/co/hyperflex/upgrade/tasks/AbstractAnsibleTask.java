package co.hyperflex.upgrade.tasks;

import co.hyperflex.ansible.AnsibleCommandExecutor;
import co.hyperflex.ansible.ExecutionContext;
import co.hyperflex.ansible.commands.AnsibleAdHocCommand;
import java.util.function.Consumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class AbstractAnsibleTask implements Task {

  private static final Logger logger = LoggerFactory.getLogger(AbstractAnsibleTask.class);
  private final AnsibleCommandExecutor ansibleCommandExecutor = new AnsibleCommandExecutor();

  protected TaskResult runAdHocCommand(AnsibleAdHocCommand cmd, Context context) {
    try {
      StringBuilder output = new StringBuilder();
      Consumer<String> consumer = s -> output.append(s).append("\n");

      ExecutionContext executionContext = new ExecutionContext(
          context.node().getIp(),
          context.config().sshInfo().username(),
          context.config().sshInfo().keyPath(),
          true,
          context.config().sshInfo().becomeUser()
      );

      int exitCode = ansibleCommandExecutor.run(executionContext, cmd, consumer, consumer);

      if (exitCode == 0) {
        return TaskResult.success(output.toString());
      } else {
        return TaskResult.failure(output.toString());
      }

    } catch (Exception e) {
      logger.error("Exception while running Ansible for host {}", context.node().getIp(), e);
      return TaskResult.failure("Exception while running Ansible: " + e.getMessage());
    }
  }

}

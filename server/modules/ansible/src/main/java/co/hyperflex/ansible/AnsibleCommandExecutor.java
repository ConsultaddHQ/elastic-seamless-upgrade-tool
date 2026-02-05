package co.hyperflex.ansible;

import co.hyperflex.ansible.commands.AnsibleAdHocCommand;
import jakarta.validation.constraints.NotNull;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AnsibleCommandExecutor {

  private static final Logger logger = LoggerFactory.getLogger(AnsibleCommandExecutor.class);

  public int run(
      @NotNull ExecutionContext context,
      @NotNull AnsibleAdHocCommand cmd,
      @NotNull Consumer<String> stdLogsConsumer,
      @NotNull Consumer<String> errLogsConsumer) {
    try {
      Process process = getProcess(context, cmd);

      BufferedReader stdOut =
          new BufferedReader(new InputStreamReader(process.getInputStream()));
      BufferedReader stdErr =
          new BufferedReader(new InputStreamReader(process.getErrorStream()));

      StringBuilder stdOutBuf = new StringBuilder();
      StringBuilder stdErrBuf = new StringBuilder();

      String line;

      while ((line = stdOut.readLine()) != null) {
        stdOutBuf.append(line).append('\n');
        stdLogsConsumer.accept(line);
        logger.warn(line);
      }

      while ((line = stdErr.readLine()) != null) {
        stdErrBuf.append(line).append('\n');
        errLogsConsumer.accept(line);
        logger.error(line);
      }

      int exitCode = process.waitFor();

      if (stdOutBuf.length() > 0) {
        logger.warn("Command output:\n{}", stdOutBuf);
      }
      if (stdErrBuf.length() > 0) {
        logger.error("Command error:\n{}", stdErrBuf);
      }
      return exitCode;
    } catch (Exception e) {
      logger.error("Failed to run ansible command", e);
      throw new AnsibleExecutionException("Failed to run ansible command", e);
    }
  }

  protected Process getProcess(ExecutionContext context, AnsibleAdHocCommand cmd) throws IOException {
    String inventory = context.getHostIp() + ",";
    List<String> command = new ArrayList<>();
    command.add("ansible");
    command.add("all");
    command.add("-i");
    command.add(inventory);
    command.add("-m");
    command.add(cmd.getModule());

    List<String> args = cmd.getArguments();
    if (!args.isEmpty()) {
      command.add("-a");
      command.add(String.join(" ", args));
    }

    command.add("-u");
    command.add(context.getSshUser());
    command.add("--private-key");
    command.add(context.getSshKeyPath());
    command.add("-e");
    command.add("ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'");
    command.add("-b");
    command.add("--become-user=" + context.getBecomeUser());
    logger.warn("Command Executed on node: {}", command);
    ProcessBuilder builder = new ProcessBuilder(command);
    return builder.start();
  }

}

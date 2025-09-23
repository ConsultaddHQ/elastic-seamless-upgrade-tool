package co.hyperflex.precheck.concrete.node.os;

import co.hyperflex.core.models.enums.ClusterType;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseNodePrecheck;
import co.hyperflex.ssh.CommandResult;
import co.hyperflex.ssh.SshCommandExecutor;
import org.springframework.stereotype.Component;

@Component
public class DiskUsagePrecheck extends BaseNodePrecheck {

  @Override
  public String getName() {
    return "Disk Utilization Check";
  }

  @Override
  public void run(NodeContext context) {
    try (SshCommandExecutor executor = context.getSshExecutor()) {
      CommandResult result = executor.execute("df -h / | tail -n 1 | awk '{ print $5 }' | tr -d %");
      if (result.isSuccess()) {
        int usage = Integer.parseInt(result.stdout());
        context.getLogger().info("Disk Utilization check completed");
        context.getLogger().info("Disk Utilized: {}%", usage);
        if (usage >= 85) {
          context.getLogger().error("Disk Utilization exceeded the threshold of 85%");
          throw new RuntimeException();
        }
      } else {
        throw new RuntimeException(result.stderr());
      }
    } catch (Exception e) {
      context.getLogger().error("Disk Utilization check failed");
      context.getLogger().error(e.getMessage());
      throw new RuntimeException("Unable to run Disk Utilization check");
    }
  }

  @Override
  public boolean shouldRun(NodeContext context) {
    return super.shouldRun(context) && context.getCluster().getType() == ClusterType.SELF_MANAGED;
  }
}

package co.hyperflex.upgrade.tasks.elastic;

import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.Task;
import co.hyperflex.upgrade.tasks.TaskResult;
import org.springframework.stereotype.Component;

@Component
public class SyncedFlushTask implements Task {

  @Override
  public String getName() {
    return "Flush data streams or indices";
  }

  @Override
  public TaskResult run(Context context) {
    context.elasticClient().flushIndices();
    return TaskResult.success("Synced flush performed.");
  }
}

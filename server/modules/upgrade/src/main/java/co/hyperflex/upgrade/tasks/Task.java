package co.hyperflex.upgrade.tasks;

import java.util.Map;

public interface Task {
  default String getId() {
    return getClass().getName();
  }

  String getName();

  TaskResult run(Context context);

  default boolean skip(Map<String, Boolean> flags) {
    return false;
  }
}

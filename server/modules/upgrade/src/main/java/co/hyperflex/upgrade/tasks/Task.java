package co.hyperflex.upgrade.tasks;

public interface Task {
  default String getId() {
    return getClass().getName();
  }

  String getName();

  TaskResult run(Context context);
}

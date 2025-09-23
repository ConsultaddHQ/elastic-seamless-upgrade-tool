package co.hyperflex.upgrade.tasks;

public record TaskResult(boolean success, String message) {

  public static TaskResult failure(String s) {
    return new TaskResult(false, s);
  }

  public static TaskResult success(String s) {
    return new TaskResult(true, s);

  }

  @Override
  public String toString() {
    return "TaskResult{" + "success=" + success + ", message='" + message + '\'' + '}';
  }
}

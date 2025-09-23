package co.hyperflex.ssh;

public interface BecomeStrategy {
  /**
   * Wrap the command for privilege escalation.
   *
   * @param command The original command
   * @return Command wrapped for the target user/method
   */
  String wrapCommand(String command);
}
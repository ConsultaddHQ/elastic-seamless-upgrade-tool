package co.hyperflex.ssh;

public class NoBecome implements BecomeStrategy {
  @Override
  public String wrapCommand(String command) {
    return command;
  }
}

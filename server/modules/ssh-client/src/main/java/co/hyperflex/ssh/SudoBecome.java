package co.hyperflex.ssh;

public class SudoBecome implements BecomeStrategy {
  private final String user;

  public SudoBecome(String user) {
    this.user = user;
  }

  @Override
  public String wrapCommand(String command) {
    if (command.startsWith("sudo")) {
      return command;
    }
    return "sudo -u " + user + " " + command;
  }
}

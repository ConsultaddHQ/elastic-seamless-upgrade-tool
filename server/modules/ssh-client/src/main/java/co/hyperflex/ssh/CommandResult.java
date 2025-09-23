package co.hyperflex.ssh;

public record CommandResult(int exitCode, String stdout, String stderr) {
  public boolean isSuccess() {
    return exitCode == 0;

  }
}



package co.hyperflex.ssh;

public class SshConnectionException extends RuntimeException {
  public SshConnectionException(String message) {
    super(message);
  }

  public SshConnectionException(String message, Throwable cause) {
    super(message, cause);
  }
}

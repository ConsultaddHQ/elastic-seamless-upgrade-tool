package co.hyperflex.ansible;

public class AnsibleExecutionException extends RuntimeException {
  public AnsibleExecutionException(String message, Throwable cause) {
    super(message, cause);
  }
}


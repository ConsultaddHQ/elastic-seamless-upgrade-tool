package co.hyperflex.precheck.core;

public class PrecheckFailedException extends RuntimeException {
  public PrecheckFailedException() {
  }

  public PrecheckFailedException(String message) {
    super(message);
  }
}

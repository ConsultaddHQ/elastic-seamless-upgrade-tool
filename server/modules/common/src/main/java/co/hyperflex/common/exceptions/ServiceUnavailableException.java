package co.hyperflex.common.exceptions;


public class ServiceUnavailableException extends AppException {

  public ServiceUnavailableException(String message) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }

  public ServiceUnavailableException() {
    super("Service Unavailable", HttpStatus.SERVICE_UNAVAILABLE);
  }
}

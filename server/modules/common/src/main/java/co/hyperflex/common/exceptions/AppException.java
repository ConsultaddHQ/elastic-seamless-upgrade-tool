package co.hyperflex.common.exceptions;


public class AppException extends RuntimeException {

  private final HttpStatus statusCode;

  public AppException(String message, HttpStatus statusCode) {
    super(message);
    this.statusCode = statusCode;
  }

  public HttpStatus getStatusCode() {
    return statusCode;
  }
}

package co.hyperflex.core.exceptions;


public class BadRequestException extends AppException {

  public BadRequestException(String message) {
    super(message, HttpStatus.BAD_REQUEST);
  }

  public BadRequestException() {
    super("Bad request", HttpStatus.BAD_REQUEST);
  }
}

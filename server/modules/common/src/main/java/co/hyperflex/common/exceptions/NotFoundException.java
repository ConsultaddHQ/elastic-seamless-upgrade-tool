package co.hyperflex.common.exceptions;


public class NotFoundException extends AppException {

  public NotFoundException(String message) {
    super(message, HttpStatus.NOT_FOUND);
  }

  public NotFoundException() {
    super("Resource not found", HttpStatus.NOT_FOUND);
  }
}

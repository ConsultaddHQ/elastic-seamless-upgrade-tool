package co.hyperflex.core.exceptions;


public class ConflictException extends AppException {

  public ConflictException(String message) {
    super(message, HttpStatus.CONFLICT);
  }

  public ConflictException() {
    super("Conflict", HttpStatus.CONFLICT);
  }
}

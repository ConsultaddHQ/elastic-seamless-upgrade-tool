package co.hyperflex.core.exceptions;


public class UnauthorizedException extends AppException {

  public UnauthorizedException(String message) {
    super(message, HttpStatus.UNAUTHORIZED);
  }

  public UnauthorizedException() {
    super("Unauthorized", HttpStatus.UNAUTHORIZED);
  }
}

package co.hyperflex.exceptions;

import org.springframework.http.HttpStatus;

public class InternalServerException extends AppException {

  public InternalServerException(String message) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  public InternalServerException() {
    super("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

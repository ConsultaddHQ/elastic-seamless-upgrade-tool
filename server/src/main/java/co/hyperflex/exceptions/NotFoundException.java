package co.hyperflex.exceptions;

import org.springframework.http.HttpStatus;

public class NotFoundException extends AppException {

  public NotFoundException(String message) {
    super(message, HttpStatus.NOT_FOUND);
  }

  public NotFoundException() {
    super("Resource not found", HttpStatus.NOT_FOUND);
  }
}

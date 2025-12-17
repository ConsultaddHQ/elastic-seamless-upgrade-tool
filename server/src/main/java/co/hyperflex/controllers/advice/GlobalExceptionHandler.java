package co.hyperflex.controllers.advice;

import co.hyperflex.core.exceptions.AppException;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(AppException.class)
  public ResponseEntity<ErrorResponse> handleAppException(AppException ex) {
    logger.error("Application exception: {}", ex.getMessage(), ex);
    ErrorResponse errorResponse = new ErrorResponse(ex.getMessage());
    return new ResponseEntity<>(errorResponse, HttpStatusCode.valueOf(ex.getStatusCode().getCode()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValidException(
      MethodArgumentNotValidException ex) {
    logger.error("Validation exception: {}", ex.getMessage(), ex);
    List<String> errorMessages = ex.getBindingResult()
        .getFieldErrors()
        .stream()
        .map(error -> String.format("%s: %s", error.getField(), error.getDefaultMessage()))
        .toList();
    return ResponseEntity.badRequest().body(Map.of("errors", errorMessages));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
    logger.error("An unexpected error occurred", ex);
    ErrorResponse errorResponse =
        new ErrorResponse("An unexpected internal server error occurred.");
    return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  public record ErrorResponse(String err) {
  }
}

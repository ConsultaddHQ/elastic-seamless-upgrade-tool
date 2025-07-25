package co.hyperflex.exceptions;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(AppException.class)
  public ResponseEntity<ErrorResponse> handleAppException(AppException ex) {
    ErrorResponse errorResponse = new ErrorResponse(ex.getMessage());
    return new ResponseEntity<>(errorResponse, ex.getStatusCode());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValidException(
      MethodArgumentNotValidException ex) {

    List<String> errorMessages = ex.getBindingResult()
        .getFieldErrors()
        .stream()
        .map(error -> String.format("%s: %s", error.getField(), error.getDefaultMessage()))
        .toList();
    return ResponseEntity.badRequest().body(Map.of("errors", errorMessages));
  }

  public record ErrorResponse(String error) {
  }
}

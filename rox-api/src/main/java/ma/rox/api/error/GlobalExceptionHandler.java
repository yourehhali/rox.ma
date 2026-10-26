package ma.rox.api.error;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiError> handleApi(ApiException ex) {
    return ResponseEntity.status(ex.status())
        .body(ApiError.of(ex.code(), ex.getMessage(), ex.details()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
    List<ApiError.FieldIssue> issues = ex.getBindingResult().getFieldErrors().stream()
        .map(GlobalExceptionHandler::toIssue).toList();
    return ResponseEntity.badRequest()
        .body(ApiError.of(ErrorCode.validation_error, "Certains champs sont invalides.", issues));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException ex) {
    return ResponseEntity.badRequest()
        .body(ApiError.of(ErrorCode.validation_error, "Corps de requête illisible."));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ApiError> handleIntegrity(DataIntegrityViolationException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(ApiError.of(ErrorCode.conflict, "Contrainte d'intégrité violée."));
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
    boolean anon = req.getUserPrincipal() == null;
    if (anon) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(ApiError.of(ErrorCode.unauthorized, "Session requise."));
    }
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(ApiError.of(ErrorCode.forbidden, "Accès refusé."));
  }

  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<ApiError> handleAuth(AuthenticationException ex) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(ApiError.of(ErrorCode.unauthorized, "Session requise."));
  }

  @ExceptionHandler(NoHandlerFoundException.class)
  public ResponseEntity<ApiError> handleNoHandler(NoHandlerFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ApiError.of(ErrorCode.not_found, "Route inconnue."));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleOther(Exception ex) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiError.of(ErrorCode.internal_error, "Erreur interne."));
  }

  private static ApiError.FieldIssue toIssue(FieldError fe) {
    return new ApiError.FieldIssue(fe.getField(), String.valueOf(fe.getCode()));
  }
}

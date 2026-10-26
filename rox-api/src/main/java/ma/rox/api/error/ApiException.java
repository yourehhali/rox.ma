package ma.rox.api.error;

import java.util.List;

public class ApiException extends RuntimeException {
  private final ErrorCode code;
  private final int status;
  private final List<ApiError.FieldIssue> details;

  public ApiException(int status, ErrorCode code, String message) {
    this(status, code, message, List.of());
  }

  public ApiException(int status, ErrorCode code, String message, List<ApiError.FieldIssue> details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  public int status() { return status; }
  public ErrorCode code() { return code; }
  public List<ApiError.FieldIssue> details() { return details; }

  public static ApiException notFound(String what) {
    return new ApiException(404, ErrorCode.not_found, what + " introuvable.");
  }
  public static ApiException conflict(String message) {
    return new ApiException(409, ErrorCode.conflict, message);
  }
  public static ApiException forbidden() {
    return new ApiException(403, ErrorCode.forbidden, "Accès refusé.");
  }
  public static ApiException unauthorized(String message) {
    return new ApiException(401, ErrorCode.unauthorized, message);
  }
  public static ApiException badRequest(String message, List<ApiError.FieldIssue> details) {
    return new ApiException(400, ErrorCode.validation_error, message, details);
  }
}

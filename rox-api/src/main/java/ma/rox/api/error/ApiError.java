package ma.rox.api.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(ErrorBody error) {
  public record ErrorBody(
      ErrorCode code,
      String message,
      @JsonInclude(JsonInclude.Include.NON_EMPTY) List<FieldIssue> details) {}

  public record FieldIssue(String field, String issue) {}

  public static ApiError of(ErrorCode code, String message) {
    return new ApiError(new ErrorBody(code, message, List.of()));
  }

  public static ApiError of(ErrorCode code, String message, List<FieldIssue> details) {
    return new ApiError(new ErrorBody(code, message, details == null ? List.of() : details));
  }
}

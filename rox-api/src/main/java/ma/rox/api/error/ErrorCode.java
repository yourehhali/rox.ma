package ma.rox.api.error;

/** Stable machine codes matching the Error schema in api-spec.json. */
public enum ErrorCode {
  unauthorized,
  forbidden,
  not_found,
  conflict,
  validation_error,
  rate_limited,
  internal_error
}

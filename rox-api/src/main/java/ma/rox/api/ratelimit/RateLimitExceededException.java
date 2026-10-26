package ma.rox.api.ratelimit;

/** Thrown by {@link RateLimitFilter} when a request exceeds the configured bucket. */
public class RateLimitExceededException extends RuntimeException {
  private final String rule;
  private final long retryAfterSeconds;

  public RateLimitExceededException(String rule, long retryAfterSeconds) {
    super("Trop de requêtes, réessayez plus tard.");
    this.rule = rule;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  public String rule() { return rule; }
  public long retryAfterSeconds() { return retryAfterSeconds; }
}

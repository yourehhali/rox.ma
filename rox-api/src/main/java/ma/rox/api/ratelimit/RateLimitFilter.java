package ma.rox.api.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import ma.rox.api.error.ApiError;
import ma.rox.api.error.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Simple per-IP token-bucket rate limiter backed by Bucket4j.
 * Buckets are held in memory — fine for a single api container. Swap to Redis
 * if we ever horizontally-scale the service.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

  /** A single rule: path+method matcher, capacity, refill period, and human-readable name. */
  private record Rule(String id, String method, String pathPrefix, long capacity, Duration window) {}

  /** Cache of buckets keyed by "ruleId:clientKey". */
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

  /** Approximate oldest-insertion timestamp so we can lazily evict cold buckets. */
  private final AtomicLong lastSweep = new AtomicLong(System.currentTimeMillis());

  private final boolean enabled;
  private final List<Rule> rules;
  private final ObjectMapper json;

  public RateLimitFilter(
      @Value("${rox.rate-limit.enabled:true}") boolean enabled,
      @Value("${rox.rate-limit.login-per-minute:5}") long loginPerMinute,
      @Value("${rox.rate-limit.signup-per-hour:2}") long signupPerHour,
      @Value("${rox.rate-limit.contact-per-minute:5}") long contactPerMinute,
      ObjectMapper json) {
    this.enabled = enabled;
    this.json = json;
    this.rules = List.of(
        new Rule("login-client",  "POST", "/auth/client/login",  loginPerMinute, Duration.ofMinutes(1)),
        new Rule("login-admin",   "POST", "/auth/admin/login",   loginPerMinute, Duration.ofMinutes(1)),
        new Rule("signup-client", "POST", "/auth/client/signup", signupPerHour,  Duration.ofHours(1)),
        new Rule("verify-otp",    "POST", "/auth/client/verify", 10,             Duration.ofHours(1)),
        new Rule("resend-otp",    "POST", "/auth/client/resend-otp", 3,          Duration.ofHours(1)),
        new Rule("contact",       "POST", "/contact",            contactPerMinute, Duration.ofMinutes(1)),
        new Rule("guest-order",   "POST", "/orders/guest",       contactPerMinute, Duration.ofMinutes(1)),
        new Rule("message",       "POST", "/messages",           contactPerMinute, Duration.ofMinutes(1)));
  }

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    if (!enabled) { chain.doFilter(req, res); return; }

    maybeSweep();

    String path = req.getRequestURI();
    String method = req.getMethod();
    for (Rule r : rules) {
      if (!r.method().equalsIgnoreCase(method)) continue;
      if (!path.equals(r.pathPrefix()) && !path.startsWith(r.pathPrefix() + "/")) continue;

      String key = r.id() + ":" + clientKey(req);
      Bucket b = buckets.computeIfAbsent(key, k -> newBucket(r));
      if (!b.tryConsume(1)) {
        long retryAfter = Math.max(1L, r.window().toSeconds());
        writeTooMany(res, retryAfter);
        return;
      }
      // first matching rule wins; do not consume more buckets this request
      break;
    }
    chain.doFilter(req, res);
  }

  /** Extract the real client IP behind Traefik (X-Forwarded-For first hop) with a remote fallback. */
  private String clientKey(HttpServletRequest req) {
    String xff = req.getHeader("X-Forwarded-For");
    if (xff != null && !xff.isBlank()) {
      int comma = xff.indexOf(',');
      return (comma > 0 ? xff.substring(0, comma) : xff).trim();
    }
    String real = req.getHeader("X-Real-IP");
    if (real != null && !real.isBlank()) return real.trim();
    String ip = req.getRemoteAddr();
    return ip == null ? "unknown" : ip;
  }

  private Bucket newBucket(Rule r) {
    Bandwidth limit = Bandwidth.builder()
        .capacity(r.capacity())
        .refillIntervally(r.capacity(), r.window())
        .build();
    return Bucket.builder().addLimit(limit).build();
  }

  private void writeTooMany(HttpServletResponse res, long retryAfterSeconds) throws IOException {
    res.setStatus(429);
    res.setContentType("application/json;charset=UTF-8");
    res.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
    ApiError body = ApiError.of(ErrorCode.rate_limited,
        "Trop de requêtes. Réessayez dans " + retryAfterSeconds + " s.");
    res.getWriter().write(json.writeValueAsString(body));
  }

  /** Cheap periodic eviction: drop cold buckets once per ~10 minutes to avoid unbounded growth. */
  private void maybeSweep() {
    long now = System.currentTimeMillis();
    long prev = lastSweep.get();
    if (now - prev < Duration.ofMinutes(10).toMillis()) return;
    if (!lastSweep.compareAndSet(prev, now)) return;
    buckets.entrySet().removeIf(e -> {
      long remaining = e.getValue().tryConsumeAndReturnRemaining(0).getRemainingTokens();
      // Any bucket that has fully refilled back to capacity is considered idle.
      return remaining < 0 ? true : false;
    });
  }
}

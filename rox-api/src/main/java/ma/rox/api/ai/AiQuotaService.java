package ma.rox.api.ai;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.Map;
import ma.rox.api.ai.PortfolioAiDtos.AiQuotaDto;
import ma.rox.api.ai.PortfolioAiDtos.ProviderQuota;
import org.springframework.stereotype.Service;

/**
 * In-memory daily budgets per free-tier provider so we stay gracefully inside
 * Google's and Cloudflare's limits (both cap each project/account on requests
 * per minute + per day; Google's RPD resets midnight Pacific, Cloudflare's
 * neurons midnight UTC — our smaller budgets reset at server midnight, which
 * is strictly safer). Each provider also has its own cooldown, triggered when
 * it answers 429, so {@link LlmRouter} can fail over to the other one instead
 * of hammering a throttled key. Single api container — same trade-off as
 * {@code RateLimitFilter}; move to Redis if we ever scale horizontally.
 */
@Service
public class AiQuotaService {

  /** One budget per provider: features fail over between them, never starve one. */
  public enum Scope { GEMINI, CLOUDFLARE }

  private final GeminiProperties geminiProps;
  private final CloudflareProperties cfProps;

  private LocalDate day = LocalDate.now();
  private final Map<Scope, Integer> used = new EnumMap<>(Scope.class);
  private final Map<Scope, Instant> cooldownUntil = new EnumMap<>(Scope.class);

  public AiQuotaService(GeminiProperties geminiProps, CloudflareProperties cfProps) {
    this.geminiProps = geminiProps;
    this.cfProps = cfProps;
  }

  public boolean configured(Scope scope) {
    return scope == Scope.GEMINI ? geminiProps.enabled() : cfProps.enabled();
  }

  public int limit(Scope scope) {
    return scope == Scope.GEMINI ? geminiProps.dailyLimit() : cfProps.dailyLimit();
  }

  /** Take one generation unit if the provider's daily budget still allows it. */
  public synchronized boolean tryConsume(Scope scope) {
    rollover();
    int u = used.getOrDefault(scope, 0);
    if (u >= limit(scope)) return false;
    used.put(scope, u + 1);
    return true;
  }

  /** Give a unit back when the outbound call never landed (network/429/5xx). */
  public synchronized void refund(Scope scope) {
    rollover();
    int u = used.getOrDefault(scope, 0);
    if (u > 0) used.put(scope, u - 1);
  }

  /** Pause one provider after its own 429 so retries can't pile up. */
  public synchronized void startCooldown(Scope scope, long seconds) {
    Instant until = Instant.now().plusSeconds(seconds);
    Instant cur = cooldownUntil.getOrDefault(scope, Instant.EPOCH);
    if (until.isAfter(cur)) cooldownUntil.put(scope, until);
  }

  public synchronized boolean coolingDown(Scope scope) {
    return cooldownUntil.getOrDefault(scope, Instant.EPOCH).isAfter(Instant.now());
  }

  /** Snapshot consumed by {@code GET /portfolio/ai-usage} to drive the admin UI. */
  public synchronized AiQuotaDto snapshot() {
    rollover();
    Instant nextMidnight =
        LocalDate.now().plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
    long resetInSeconds = Duration.between(Instant.now(), nextMidnight).getSeconds();
    ProviderQuota gemini = quotaOf(Scope.GEMINI, "Gemini", geminiProps.model());
    ProviderQuota cloudflare = quotaOf(Scope.CLOUDFLARE, "Cloudflare", cfProps.model());
    boolean enabled = gemini.configured() || cloudflare.configured();
    return new AiQuotaDto(enabled, gemini, cloudflare, resetInSeconds);
  }

  private ProviderQuota quotaOf(Scope scope, String name, String model) {
    int u = used.getOrDefault(scope, 0);
    int lim = limit(scope);
    boolean cooling = coolingDown(scope);
    long cooldownSeconds = cooling
        ? Math.max(1, Duration.between(Instant.now(),
            cooldownUntil.getOrDefault(scope, Instant.EPOCH)).getSeconds())
        : 0;
    return new ProviderQuota(
        name, configured(scope), model, lim, u, Math.max(0, lim - u), cooling, cooldownSeconds);
  }

  /** Fresh counters once the server day changes. */
  private void rollover() {
    LocalDate today = LocalDate.now();
    if (!today.equals(day)) {
      day = today;
      used.clear();
      cooldownUntil.clear();
    }
  }
}

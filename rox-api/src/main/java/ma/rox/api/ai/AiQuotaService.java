package ma.rox.api.ai;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.Map;
import ma.rox.api.ai.PortfolioAiDtos.AiQuotaDto;
import org.springframework.stereotype.Service;

/**
 * In-memory daily budgets for Gemini calls so we stay gracefully inside the free
 * tier (Google limits each project on RPM, TPM and RPD — RPD resets at midnight
 * Pacific; our own smaller budgets reset at server midnight, which is strictly
 * safer). Two scopes keep features from starving each other: PORTFOLIO (manual
 * "Remplir avec l'IA" drafts) and ORDER (automatic brief triage on new orders).
 * Also holds a shared cooldown whenever Google answers 429, so the UI can pause
 * instead of hammering a throttled key. Single api container — same trade-off as
 * {@code RateLimitFilter}; move to Redis if we ever scale horizontally.
 */
@Service
public class AiQuotaService {

  public enum Scope { PORTFOLIO, ORDER }

  private final GeminiProperties props;

  private LocalDate day = LocalDate.now();
  private final Map<Scope, Integer> used = new EnumMap<>(Scope.class);
  private Instant cooldownUntil = Instant.EPOCH;

  public AiQuotaService(GeminiProperties props) {
    this.props = props;
  }

  /** Take one generation unit if the scope's daily budget still allows it. */
  public synchronized boolean tryConsume(Scope scope) {
    rollover();
    int u = used.getOrDefault(scope, 0);
    if (u >= limit(scope)) return false;
    used.put(scope, u + 1);
    return true;
  }

  /** Give a unit back when the outbound call never reached Gemini (network/429/5xx). */
  public synchronized void refund(Scope scope) {
    rollover();
    int u = used.getOrDefault(scope, 0);
    if (u > 0) used.put(scope, u - 1);
  }

  /** Pause the assistant after a Google-side 429 so retries can't pile up. */
  public synchronized void startCooldown(long seconds) {
    Instant until = Instant.now().plusSeconds(seconds);
    if (until.isAfter(cooldownUntil)) cooldownUntil = until;
  }

  public synchronized boolean coolingDown() {
    return cooldownUntil.isAfter(Instant.now());
  }

  /** Snapshot consumed by {@code GET /portfolio/ai-usage} to drive the admin UI. */
  public synchronized AiQuotaDto snapshot() {
    rollover();
    Instant nextMidnight =
        LocalDate.now().plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
    long resetInSeconds = Duration.between(Instant.now(), nextMidnight).getSeconds();
    boolean cooling = cooldownUntil.isAfter(Instant.now());
    long cooldownSeconds =
        cooling ? Math.max(1, Duration.between(Instant.now(), cooldownUntil).getSeconds()) : 0;
    int pUsed = used.getOrDefault(Scope.PORTFOLIO, 0);
    int oUsed = used.getOrDefault(Scope.ORDER, 0);
    int pLimit = props.dailyLimit();
    int oLimit = props.orderDailyLimit();
    return new AiQuotaDto(
        props.enabled(), pLimit, pUsed, Math.max(0, pLimit - pUsed),
        oLimit, oUsed, Math.max(0, oLimit - oUsed),
        resetInSeconds, cooling, cooldownSeconds);
  }

  private int limit(Scope scope) {
    return scope == Scope.PORTFOLIO ? props.dailyLimit() : props.orderDailyLimit();
  }

  /** Fresh counters once the server day changes. */
  private void rollover() {
    LocalDate today = LocalDate.now();
    if (!today.equals(day)) {
      day = today;
      used.clear();
    }
  }
}

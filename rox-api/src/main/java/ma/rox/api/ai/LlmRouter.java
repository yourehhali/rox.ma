package ma.rox.api.ai;

import java.util.List;
import ma.rox.api.ai.AiQuotaService.Scope;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

/**
 * Picks a free-tier provider per task and fails over when needed:
 *
 * <ul>
 *   <li>{@link Route#QUALITY_FIRST} — manual, quality-sensitive writes (portfolio
 *       "Remplir avec l'IA"): Gemini 2.0 Flash first (better French copywriting,
 *       native JSON mode), Cloudflare as overflow.</li>
 *   <li>{@link Route#BULK_FIRST} — automatic, high-volume tasks (order brief
 *       triage): Cloudflare Workers AI first (10k free neurons/day, roughly
 *       thousands of small calls), Gemini only when Cloudflare is missing,
 *       throttled or out of budget.</li>
 * </ul>
 *
 * Every attempt spends the provider's own daily budget ({@link AiQuotaService})
 * and is refunded when the call never landed; a provider-side 429 puts that
 * provider on a short cooldown so the other one takes over instead of both
 * getting hammered. Both JSON-in/JSON-out: prompts must ask for a JSON object.
 */
@Service
public class LlmRouter {

  private static final Logger log = LoggerFactory.getLogger(LlmRouter.class);
  /** Pause applied to a provider that answered 429 — clears a per-minute window. */
  private static final long THROTTLE_COOLDOWN_SECONDS = 60;

  public enum Route { QUALITY_FIRST, BULK_FIRST }

  public record AiAnswer(String text, String provider) {}

  /** Every configured provider is out of daily budget or on cooldown. */
  public static class NoCapacityException extends RuntimeException {
    public NoCapacityException(String message) { super(message); }
  }

  /** At least one provider was tried and every attempt failed. */
  public static class LlmUnavailableException extends RuntimeException {
    public LlmUnavailableException(String message, Throwable cause) { super(message, cause); }
  }

  private final GeminiClient gemini;
  private final GeminiProperties geminiProps;
  private final CloudflareClient cloudflare;
  private final CloudflareProperties cfProps;
  private final AiQuotaService quota;

  public LlmRouter(GeminiClient gemini, GeminiProperties geminiProps,
                   CloudflareClient cloudflare, CloudflareProperties cfProps,
                   AiQuotaService quota) {
    this.gemini = gemini;
    this.geminiProps = geminiProps;
    this.cloudflare = cloudflare;
    this.cfProps = cfProps;
    this.quota = quota;
  }

  public boolean hasAnyConfigured() {
    return quota.configured(Scope.GEMINI) || quota.configured(Scope.CLOUDFLARE);
  }

  public LlmRouter.AiAnswer generate(Route route, String prompt, int maxOutputTokens) {
    List<Scope> order = route == Route.QUALITY_FIRST
        ? List.of(Scope.GEMINI, Scope.CLOUDFLARE)
        : List.of(Scope.CLOUDFLARE, Scope.GEMINI);

    boolean anyConfigured = false;
    boolean anyCooling = false;
    boolean anyBudgetLeft = false;
    RuntimeException last = null;

    for (Scope scope : order) {
      if (!quota.configured(scope)) continue;
      anyConfigured = true;
      if (quota.coolingDown(scope)) { anyCooling = true; continue; }
      if (!quota.tryConsume(scope)) continue; // daily budget exhausted
      anyBudgetLeft = true;
      try {
        String text = scope == Scope.GEMINI
            ? gemini.generate(geminiProps.baseUrl(), geminiProps.apiKey(), geminiProps.model(),
                prompt, true, maxOutputTokens)
            : cloudflare.generate(cfProps.baseUrl(), cfProps.accountId(), cfProps.apiToken(),
                cfProps.model(), prompt, maxOutputTokens);
        if (text == null || text.isBlank()) {
          quota.refund(scope);
          last = new IllegalStateException(scope + " returned an empty answer");
          continue;
        }
        return new AiAnswer(text, scope.name());
      } catch (RestClientResponseException ex) {
        quota.refund(scope); // the call was rejected — don't charge the budget
        if (ex.getStatusCode().value() == 429) {
          quota.startCooldown(scope, THROTTLE_COOLDOWN_SECONDS);
          log.warn("{} free-tier 429 — provider on cooldown for {}s", scope, THROTTLE_COOLDOWN_SECONDS);
        } else {
          log.warn("{} call failed ({})", scope, ex.getStatusCode().value());
        }
        last = ex;
      } catch (RuntimeException ex) {
        quota.refund(scope);
        log.warn("{} call failed: {}", scope, ex.getMessage());
        last = ex;
      }
    }

    if (!anyConfigured) throw new NoCapacityException("Assistant IA non configuré (GEMINI_API_KEY ou Cloudflare AI).");
    if (last != null) throw new LlmUnavailableException("Tous les assistants IA sont indisponibles.", last);
    if (anyCooling && !anyBudgetLeft) {
      throw new NoCapacityException("Les assistants IA observent une pause (limites free-tier) — réessayez dans un instant.");
    }
    throw new NoCapacityException("Quota IA du jour épuisé (Gemini et Cloudflare) — retour après minuit.");
  }
}

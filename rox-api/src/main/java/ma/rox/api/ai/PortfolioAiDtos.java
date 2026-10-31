package ma.rox.api.ai;

import java.util.List;

/** Request/response records for the portfolio "Remplir avec l'IA" helper. */
public final class PortfolioAiDtos {
  private PortfolioAiDtos() {}

  /** A short free-text brief plus any already-known fields to steer generation. */
  public record AiDraftRequest(String brief, String client, String sector) {}

  /**
   * The generated draft, mirroring the admin form fields. Nulls simply mean "leave
   * the current field untouched". Never persisted on its own — the admin reviews it
   * in the form and only an explicit save writes to the DB.
   */
  public record PortfolioDraftDto(
      String title, String sector, String service, String city,
      String summary, String result, List<String> tags,
      String colorA, String colorB) {}

  /**
   * Free-tier usage budget for one provider (Gemini or Cloudflare Workers AI):
   * how many generations are left today and whether it is briefly paused after
   * its own 429. Read-only — it never blocks anything by itself, the numbers
   * just steer the interface and {@link LlmRouter}.
   */
  public record ProviderQuota(
      String name, boolean configured, String model,
      int dailyLimit, int usedToday, int remainingToday,
      boolean coolingDown, long cooldownSeconds) {}

  /** Aggregate view served by {@code GET /portfolio/ai-usage}. */
  public record AiQuotaDto(
      boolean enabled, ProviderQuota gemini, ProviderQuota cloudflare,
      long resetInSeconds) {}
}

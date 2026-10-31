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
}

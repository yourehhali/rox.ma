package ma.rox.api.portfolio;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public final class PortfolioDtos {
  private PortfolioDtos() {}

  public record Colors(
      @Pattern(regexp = "#[0-9A-Fa-f]{6}") String a,
      @Pattern(regexp = "#[0-9A-Fa-f]{6}") String b) {}

  public record PortfolioItemDto(
      String id, String title, String client, String sector, String service, String city,
      String summary, String result, List<String> tags, Colors colors,
      boolean featured, boolean published, String createdAt) {}

  public record PortfolioItemInput(
      @NotBlank String title,
      @NotBlank String client,
      @NotBlank String sector,
      String service,
      String city,
      String summary,
      String result,
      List<String> tags,
      @Valid Colors colors,
      Boolean featured,
      Boolean published) {}
}

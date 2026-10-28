package ma.rox.api.content;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public final class ContentDtos {
  private ContentDtos() {}

  public record ServiceExtraDto(String title, String text) {}

  public record ServicePageDto(
      String eyebrow, String title, String lead, String heading, String subtext,
      List<String> points,
      List<ServiceExtraDto> extras,
      String priceLabel, String priceValue) {}

  public record ServiceDto(
      String id, String slug, String name, String tag, String icon,
      @JsonProperty("short") String shortDesc,
      String faqKey, boolean published, ServicePageDto page) {}

  public record ServiceInput(
      String slug,
      @NotBlank String name,
      String tag,
      String icon,
      @JsonProperty("short") @NotBlank String shortDesc,
      String faqKey,
      Boolean published,
      @Valid ServicePageDto page) {}

  public record PlanDto(String id, String name, String price, String unit, String description, List<String> features, boolean highlight) {}
  public record PlanInput(@NotBlank String name, String price, String unit, String description, List<String> features, Boolean highlight) {}

  public record FaqItemDto(String q, String a) {}

  public record SiteInfoDto(
      String email,
      String phone,
      String whatsapp,
      List<String> cities,
      String pricingNote,
      boolean whatsappEnabled,
      String whatsappMessage,
      String whatsappPosition) {}

  /** Aggregate GET /content */
  public record SiteContentDto(
      List<ServiceDto> services,
      List<PlanDto> plans,
      java.util.Map<String, List<FaqItemDto>> faqs,
      SiteInfoDto info) {}
}

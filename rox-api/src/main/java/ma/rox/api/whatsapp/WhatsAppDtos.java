package ma.rox.api.whatsapp;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Size;

/** DTOs for the WhatsApp (OpenWA) admin settings surface. */
public final class WhatsAppDtos {
  private WhatsAppDtos() {}

  /** Read model — apiKey is masked (never the real secret). */
  public record SettingsDto(
      boolean enabled, String baseUrl, String apiKeyMasked, boolean apiKeySet,
      String sessionName, String sessionId, String messageTemplate, String updatedAt) {}

  /**
   * Write model — every field optional. A blank/masked {@code apiKey} means
   * "keep the stored key". {@code baseUrl}/{@code messageTemplate} are trimmed.
   */
  public record SettingsInput(
      Boolean enabled,
      @Size(max = 255) String baseUrl,
      @Size(max = 512) String apiKey,
      @Size(max = 50) String sessionName,
      @Size(max = 4096) String messageTemplate) {}

  /** Gateway + session health for the status pill. */
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public record StatusDto(
      boolean enabled, boolean reachable, String gatewayError,
      String sessionId, String sessionName, String sessionStatus, boolean sessionPaired) {}

  /** QR payload for pairing — {@code qrCode} is a PNG data URL, or null when not ready. */
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public record QrDto(String qrCode, String status) {}

  public record TestRequest(String phone) {}

  public record SendResult(boolean sent, String messageId, String error) {}
}

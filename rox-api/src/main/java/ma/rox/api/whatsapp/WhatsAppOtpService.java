package ma.rox.api.whatsapp;

import ma.rox.api.whatsapp.WhatsAppDtos.SendResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Delivers OTP codes over WhatsApp via OpenWA. Best-effort and async, mirroring
 * {@link ma.rox.api.auth.EmailService}: signup/resend never fail on a WhatsApp
 * hiccup. Skips silently when the channel is disabled/unconfigured or the
 * recipient has no usable phone.
 */
@Service
public class WhatsAppOtpService {

  private static final Logger log = LoggerFactory.getLogger(WhatsAppOtpService.class);

  private final WhatsAppSettingsService settings;
  private final WhatsAppClient client;

  public WhatsAppOtpService(WhatsAppSettingsService settings, WhatsAppClient client) {
    this.settings = settings;
    this.client = client;
  }

  /** Fire-and-forget signup code. Callers already persisted the OTP row. */
  @Async
  public void sendSignupCode(String phone, String code, long minutes, String name) {
    try {
      WhatsAppSettingsService.Effective e = settings.effective();
      if (!e.configured()) return;
      String chatId = toChatId(phone);
      if (chatId == null) {
        log.debug("WhatsApp OTP skipped — no valid phone");
        return;
      }
      String text = format(e.messageTemplate(), code, minutes, name);
      client.sendText(e.baseUrl(), e.apiKey(), e.sessionId(), chatId, text);
      log.info("WhatsApp OTP sent to {}", chatId);
    } catch (Exception ex) {
      log.error("WhatsApp OTP send FAILED for {}: {}", phone, ex.getMessage(), ex);
    }
  }

  /** Admin "send test" — synchronous so the panel can surface success/failure. */
  public SendResult sendTest(String phone) {
    WhatsAppSettingsService.Effective e = settings.effective();
    if (!e.enabled()) return new SendResult(false, null, "WhatsApp channel disabled.");
    if (e.baseUrl() == null || e.baseUrl().isBlank() || e.apiKey() == null || e.apiKey().isBlank()) {
      return new SendResult(false, null, "Base URL / API key not configured.");
    }
    if (e.sessionId() == null || e.sessionId().isBlank()) {
      return new SendResult(false, null, "No WhatsApp session paired yet.");
    }
    String chatId = toChatId(phone);
    if (chatId == null) return new SendResult(false, null, "Invalid phone number.");
    try {
      String text = format(e.messageTemplate(), "123456", 15, settings.effective().sessionName());
      String id = client.sendText(e.baseUrl(), e.apiKey(), e.sessionId(), chatId, text);
      return new SendResult(true, id, null);
    } catch (Exception ex) {
      return new SendResult(false, null, ex.getMessage());
    }
  }

  /**
   * Normalize a phone to OpenWA's WhatsApp chat id {@code <digits>@c.us}.
   * Requires an international number (country code); a leading {@code +}/00 and
   * all non-digits are stripped. Returns null when too short to be plausible.
   */
  static String toChatId(String phone) {
    if (phone == null) return null;
    String p = phone.trim();
    if (p.startsWith("00")) p = p.substring(2);
    String digits = p.replaceAll("[^0-9]", "");
    if (digits.length() < 8) return null;
    return digits + "@c.us";
  }

  /** Replace {code}, {minutes}, {name}; tolerate a null template. */
  static String format(String template, String code, long minutes, String name) {
    String t = (template == null || template.isBlank())
        ? "ROX — votre code de vérification : {code} (valide {minutes} min)."
        : template;
    return t.replace("{code}", code == null ? "" : code)
        .replace("{minutes}", String.valueOf(minutes))
        .replace("{name}", name == null ? "" : name);
  }
}

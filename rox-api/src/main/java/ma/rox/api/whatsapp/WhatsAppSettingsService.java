package ma.rox.api.whatsapp;

import static ma.rox.api.common.IdGen.nowUtc;

import java.util.Optional;
import ma.rox.api.whatsapp.WhatsAppDtos.SettingsDto;
import ma.rox.api.whatsapp.WhatsAppDtos.SettingsInput;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owns the single {@link WhatsAppSettings} row. Public getters return an
 * <em>effective</em> view where blank DB columns fall back to env-derived
 * defaults ({@code rox.whatsapp.*}), so the gateway works from env before the
 * admin ever opens the panel, and admin edits override env thereafter.
 *
 * <p>The API key is never returned in the clear: {@link #view()} masks it and
 * only reports whether one is set. On save, a blank or masked {@code apiKey}
 * means "keep the existing secret".
 */
@Service
public class WhatsAppSettingsService {

  public static final String SINGLETON_ID = "singleton";
  private static final String MASK = "••••••••";

  private final WhatsAppSettingsRepo repo;

  // Env-derived defaults (see application.yml → rox.whatsapp.*).
  private final boolean envEnabled;
  private final String envBaseUrl;
  private final String envApiKey;
  private final String envSessionName;
  private final String envTemplate;

  public WhatsAppSettingsService(
      WhatsAppSettingsRepo repo,
      @Value("${rox.whatsapp.enabled:false}") boolean envEnabled,
      @Value("${rox.whatsapp.base-url:}") String envBaseUrl,
      @Value("${rox.whatsapp.api-key:}") String envApiKey,
      @Value("${rox.whatsapp.session-name:rox}") String envSessionName,
      @Value("${rox.whatsapp.message-template:ROX — votre code de vérification : {code} (valide {minutes} min).}")
          String envTemplate) {
    this.repo = repo;
    this.envEnabled = envEnabled;
    this.envBaseUrl = envBaseUrl;
    this.envApiKey = envApiKey;
    this.envSessionName = envSessionName;
    this.envTemplate = envTemplate;
  }

  /** Resolved, env-merged settings used by the client/OTP services at runtime. */
  public record Effective(
      boolean enabled, String baseUrl, String apiKey,
      String sessionName, String sessionId, String messageTemplate) {
    public boolean configured() {
      return enabled && baseUrl != null && !baseUrl.isBlank()
          && apiKey != null && !apiKey.isBlank()
          && sessionId != null && !sessionId.isBlank();
    }
  }

  @Transactional(readOnly = true)
  public Effective effective() {
    WhatsAppSettings s = load();
    boolean enabled = s.isEnabled() || envEnabled;
    return new Effective(
        enabled,
        orDefault(s.getBaseUrl(), envBaseUrl),
        orDefault(s.getApiKey(), envApiKey),
        orDefault(s.getSessionName(), envSessionName),
        s.getSessionId(),
        orDefault(s.getMessageTemplate(), envTemplate));
  }

  /** Admin read — masked key, never the secret. */
  @Transactional(readOnly = true)
  public SettingsDto view() {
    Effective e = effective();
    boolean hasKey = e.apiKey() != null && !e.apiKey().isBlank();
    return new SettingsDto(
        e.enabled(), e.baseUrl(), hasKey ? mask(e.apiKey()) : null, hasKey,
        e.sessionName(), e.sessionId(), e.messageTemplate(),
        ma.rox.api.common.IdGen.iso(load().getUpdatedAt()));
  }

  @Transactional
  public SettingsDto update(SettingsInput in) {
    WhatsAppSettings s = load();
    if (in.enabled() != null) s.setEnabled(in.enabled());
    if (present(in.baseUrl())) s.setBaseUrl(in.baseUrl().trim());
    // A blank or masked submission means "leave the stored secret untouched".
    if (present(in.apiKey()) && !in.apiKey().trim().startsWith("•")) s.setApiKey(in.apiKey().trim());
    if (present(in.sessionName())) s.setSessionName(in.sessionName().trim());
    if (present(in.messageTemplate())) s.setMessageTemplate(in.messageTemplate());
    s.setUpdatedAt(nowUtc());
    repo.save(s);
    return view();
  }

  /** Persist the OpenWA session id after create/resolve so sends know where to go. */
  @Transactional
  public void storeSessionId(String sessionId) {
    WhatsAppSettings s = load();
    s.setSessionId(sessionId);
    s.setUpdatedAt(nowUtc());
    repo.save(s);
  }

  @Transactional(readOnly = true)
  public String currentSessionId() { return effective().sessionId(); }

  private WhatsAppSettings load() {
    return repo.findById(SINGLETON_ID).orElseGet(() -> {
      WhatsAppSettings s = new WhatsAppSettings();
      s.setId(SINGLETON_ID);
      s.setEnabled(false);
      s.setUpdatedAt(nowUtc());
      return s;
    });
  }

  private static String orDefault(String v, String dflt) {
    return v == null || v.isBlank() ? dflt : v;
  }

  private static boolean present(String v) {
    return v != null && !v.isBlank();
  }

  /** Show last 4 chars only: `••••••••1a2b`. */
  private static String mask(String key) {
    String tail = key.length() > 4 ? key.substring(key.length() - 4) : "";
    return MASK + tail;
  }

  /** Env-derived template default, used if the row is empty. Exposed for OTP formatting. */
  public String defaultTemplate() { return envTemplate; }

  Optional<WhatsAppSettings> raw() { return repo.findById(SINGLETON_ID); }
}

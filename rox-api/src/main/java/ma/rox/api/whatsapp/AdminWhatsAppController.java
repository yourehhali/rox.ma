package ma.rox.api.whatsapp;

import jakarta.validation.Valid;
import java.util.Optional;
import ma.rox.api.error.ApiException;
import ma.rox.api.whatsapp.WhatsAppClient.QrResult;
import ma.rox.api.whatsapp.WhatsAppClient.SessionInfo;
import ma.rox.api.whatsapp.WhatsAppDtos.QrDto;
import ma.rox.api.whatsapp.WhatsAppDtos.SendResult;
import ma.rox.api.whatsapp.WhatsAppDtos.SettingsDto;
import ma.rox.api.whatsapp.WhatsAppDtos.SettingsInput;
import ma.rox.api.whatsapp.WhatsAppDtos.StatusDto;
import org.springframework.web.bind.annotation.*;

/**
 * Admin control surface for the OpenWA WhatsApp OTP gateway. Auto ADMIN-only via
 * SecurityConfig's `/admin/**` rule. Proxies OpenWA (health, session create/start,
 * QR pairing) so OpenWA's own dashboard stays internal-only. Network failures are
 * reported in-band (reachable=false / error field) rather than 5xx.
 */
@RestController
@RequestMapping("/admin/whatsapp")
public class AdminWhatsAppController {

  private final WhatsAppSettingsService settings;
  private final WhatsAppClient client;
  private final WhatsAppOtpService otpService;

  public AdminWhatsAppController(WhatsAppSettingsService settings, WhatsAppClient client,
                                 WhatsAppOtpService otpService) {
    this.settings = settings;
    this.client = client;
    this.otpService = otpService;
  }

  @GetMapping("/settings")
  public SettingsDto getSettings() { return settings.view(); }

  @PutMapping("/settings")
  public SettingsDto putSettings(@Valid @RequestBody SettingsInput body) {
    return settings.update(body);
  }

  @GetMapping("/status")
  public StatusDto status() {
    WhatsAppSettingsService.Effective e = settings.effective();
    boolean reachable = false;
    String gwError = null;
    if (e.baseUrl() == null || e.baseUrl().isBlank()) {
      gwError = "Base URL non configurée.";
    } else {
      reachable = client.health(e.baseUrl());
      if (!reachable) gwError = "Passerelle injoignable.";
    }
    String sessionId = e.sessionId();
    String status = null;
    boolean paired = false;
    if (reachable && sessionId != null && !sessionId.isBlank() && hasKey(e)) {
      try {
        Optional<SessionInfo> s = client.findByName(e.baseUrl(), e.apiKey(), e.sessionName())
            .filter(x -> sessionId.equals(x.id()));
        if (s.isPresent()) {
          status = s.get().status();
          paired = "ready".equalsIgnoreCase(status);
        }
      } catch (RuntimeException ex) {
        gwError = ex.getMessage();
      }
    }
    return new StatusDto(e.enabled(), reachable, gwError, sessionId, e.sessionName(), status, paired);
  }

  /** Create (or resolve an existing session with the configured name) and store its id. */
  @PostMapping("/session")
  public StatusDto createSession() {
    WhatsAppSettingsService.Effective e = requireConfigured();
    SessionInfo s;
    Optional<SessionInfo> existing = client.findByName(e.baseUrl(), e.apiKey(), e.sessionName());
    if (existing.isPresent()) {
      s = existing.get();
    } else {
      try {
        s = client.createSession(e.baseUrl(), e.apiKey(), e.sessionName());
      } catch (org.springframework.web.client.HttpClientErrorException.Conflict dup) {
        // Lost a create race — re-resolve by name.
        s = client.findByName(e.baseUrl(), e.apiKey(), e.sessionName())
            .orElseThrow(() -> ApiException.badRequest("Session existante introuvable."));
      }
    }
    if (s != null && s.id() != null) settings.storeSessionId(s.id());
    return status();
  }

  @PostMapping("/session/start")
  public StatusDto startSession() {
    WhatsAppSettingsService.Effective e = requireConfigured();
    String sid = resolveSessionId(e);
    client.startSession(e.baseUrl(), e.apiKey(), sid);
    return status();
  }

  @GetMapping("/session/qr")
  public QrDto qr() {
    WhatsAppSettingsService.Effective e = requireConfigured();
    String sid = resolveSessionId(e);
    QrResult r = client.getQr(e.baseUrl(), e.apiKey(), sid);
    return new QrDto(r.qrCode(), r.status());
  }

  @PostMapping("/test")
  public SendResult test(@RequestBody WhatsAppDtos.TestRequest body) {
    return otpService.sendTest(body == null ? null : body.phone());
  }

  private WhatsAppSettingsService.Effective requireConfigured() {
    WhatsAppSettingsService.Effective e = settings.effective();
    if (e.baseUrl() == null || e.baseUrl().isBlank()) {
      throw ApiException.badRequest("Configurez l'URL de la passerelle OpenWA.");
    }
    if (e.apiKey() == null || e.apiKey().isBlank()) {
      throw ApiException.badRequest("Configurez la clé API OpenWA.");
    }
    return e;
  }

  private String resolveSessionId(WhatsAppSettingsService.Effective e) {
    if (e.sessionId() != null && !e.sessionId().isBlank()) return e.sessionId();
    Optional<SessionInfo> byName = client.findByName(e.baseUrl(), e.apiKey(), e.sessionName());
    String id = byName.map(SessionInfo::id).orElse(null);
    if (id == null) throw ApiException.badRequest("Aucune session WhatsApp — créez-en une d'abord.");
    settings.storeSessionId(id);
    return id;
  }

  private static boolean hasKey(WhatsAppSettingsService.Effective e) {
    return e.apiKey() != null && !e.apiKey().isBlank();
  }
}

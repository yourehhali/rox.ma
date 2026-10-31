package ma.rox.api.whatsapp;

import ma.rox.api.auth.ClientAccount;
import ma.rox.api.auth.ClientRepo;
import ma.rox.api.events.Events.BookingRequested;
import ma.rox.api.events.Events.ChangeRequestSubmitted;
import ma.rox.api.events.Events.ClientRegistered;
import ma.rox.api.events.Events.MessagePosted;
import ma.rox.api.events.Events.OrderCreated;
import ma.rox.api.whatsapp.WhatsAppClient.SessionInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Pushes site-activity alerts to the agency's own WhatsApp number through the
 * same OpenWA gateway used for OTP. Fires on every visitor/client-side event
 * (new order or lead, signup, client message, call booking, change request) —
 * admin-originated actions are not relayed. Best-effort and async like
 * {@link WhatsAppOtpService}: a gateway hiccup never breaks the request that
 * triggered the event. Skips silently unless {@code canNotify()} (switch +
 * gateway + phone all set).
 */
@Service
public class AdminWhatsAppNotifier {

  private static final Logger log = LoggerFactory.getLogger(AdminWhatsAppNotifier.class);
  private static final String PREFIX = "ROX 🔔 ";

  private final WhatsAppSettingsService settings;
  private final WhatsAppClient client;
  private final ClientRepo clients;

  public AdminWhatsAppNotifier(WhatsAppSettingsService settings, WhatsAppClient client,
                               ClientRepo clients) {
    this.settings = settings;
    this.client = client;
    this.clients = clients;
  }

  @Async
  @EventListener
  public void onOrderCreated(OrderCreated e) {
    StringBuilder msg = new StringBuilder(PREFIX)
        .append("Nouvelle commande : ").append(nvl(e.title())).append("\n")
        .append("Service : ").append(nvl(e.service()));
    String who = e.phone() != null && !e.phone().isBlank() ? e.phone() : clientRef(e.clientId());
    if (who != null) msg.append("\nContact : ").append(who);
    if (e.description() != null && !e.description().isBlank()) {
      msg.append("\n\n").append(preview(e.description(), 300));
    }
    send(msg.toString());
  }

  @Async
  @EventListener
  public void onClientRegistered(ClientRegistered e) {
    send(PREFIX + "Nouveau client inscrit : " + nvl(e.phone())
        + (e.name() != null && !e.name().equals(e.phone()) ? " (" + e.name() + ")" : ""));
  }

  @Async
  @EventListener
  public void onMessagePosted(MessagePosted e) {
    // Admin/rep replies never loop back to the admin's own WhatsApp.
    if (!"client".equals(e.sender())) return;
    String who = clientRef(e.clientId());
    send(PREFIX + "Message client" + (who != null ? " de " + who : "") + " :\n"
        + preview(nvl(e.textPreview()), 300));
  }

  @Async
  @EventListener
  public void onBookingRequested(BookingRequested e) {
    String who = clientRef(e.clientId());
    send(PREFIX + "Appel demandé" + (who != null ? " par " + who : "") + " :\n"
        + e.date() + " à " + e.time());
  }

  @Async
  @EventListener
  public void onChangeRequestSubmitted(ChangeRequestSubmitted e) {
    String who = clientRef(e.clientId());
    send(PREFIX + "Demande de " + ("edit".equals(e.type()) ? "modification" : "mise à jour")
        + (who != null ? " — " + who : "") + "\nCommande : " + e.orderId());
  }

  // ---------- Internals ----------

  /** Fire-and-forget; every failure path is swallowed with a log line. */
  private void send(String text) {
    try {
      WhatsAppSettingsService.Effective e = settings.effective();
      if (!e.canNotify()) return;
      String chatId = WhatsAppOtpService.toChatId(e.notifyPhone());
      if (chatId == null) {
        log.warn("WhatsApp admin notify skipped — invalid notify phone");
        return;
      }
      String sid = resolveSessionId(e);
      if (sid == null) {
        log.warn("WhatsApp admin notify skipped — no paired session");
        return;
      }
      client.sendText(e.baseUrl(), e.apiKey(), sid, chatId, text);
      log.info("WhatsApp admin notify sent to {}", chatId);
    } catch (Exception ex) {
      log.error("WhatsApp admin notify FAILED: {}", ex.getMessage(), ex);
    }
  }

  /** Stored session id when present; otherwise resolve by name once (mirrors the admin controller). */
  private String resolveSessionId(WhatsAppSettingsService.Effective e) {
    if (e.sessionId() != null && !e.sessionId().isBlank()) return e.sessionId();
    String id = client.findByName(e.baseUrl(), e.apiKey(), e.sessionName())
        .map(SessionInfo::id).orElse(null);
    if (id != null) settings.storeSessionId(id);
    return id;
  }

  /** "Name · phone" for the client row, or null when unknown (guest leads). */
  private String clientRef(String clientId) {
    if (clientId == null || clientId.isBlank()) return null;
    return clients.findById(clientId).map(AdminWhatsAppNotifier::describe).orElse(null);
  }

  private static String describe(ClientAccount c) {
    String name = c.getName() == null || c.getName().isBlank() ? "?" : c.getName();
    String phone = c.getPhone() == null || c.getPhone().isBlank() ? "" : " · " + c.getPhone();
    return name + phone;
  }

  private static String preview(String text, int max) {
    if (text == null) return "";
    String t = text.strip();
    return t.length() > max ? t.substring(0, max - 1) + "…" : t;
  }

  private static String nvl(String s) { return s == null ? "" : s; }
}

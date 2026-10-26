package ma.rox.api.events;

import java.util.List;
import ma.rox.api.events.Events.*;
import ma.rox.api.notification.NotificationService;
import ma.rox.api.security.Role;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Translates domain events into durable notification rows (delivered to
 * `/user/queue/notifications`) and topic broadcasts used by the admin board.
 *
 * Admin recipients are best-effort: this implementation broadcasts to every
 * connected admin via `/topic/admin/notifications` because the API does not
 * model multiple admin users today (single seeded `admin@rox.ma`).
 */
@Component
public class NotificationListener {

  private final NotificationService notifier;

  public NotificationListener(NotificationService notifier) { this.notifier = notifier; }

  @EventListener
  public void onOrderCreated(OrderCreated e) {
    notifier.notify(Role.ADMIN.name(), "admin", "order", e.orderId(),
        "Nouvelle commande", e.title() + " — " + e.service());
  }

  @EventListener
  public void onPhaseAdvanced(PhaseAdvanced e) {
    notifier.notify(Role.CLIENT.name(), e.clientId(), "phase", e.orderId(),
        "Avancement", "Votre commande est passée à la phase « " + e.phase() + " ».");
    broadcastAdmin("phase", e.orderId(), "Phase → " + e.phase());
  }

  @EventListener
  public void onStatusChanged(StatusChanged e) {
    notifier.notify(Role.CLIENT.name(), e.clientId(), "order", e.orderId(),
        "Statut mis à jour", "Statut : " + e.status());
  }

  @EventListener
  public void onMessagePosted(MessagePosted e) {
    String preview = e.textPreview() == null ? "" :
        (e.textPreview().length() > 120 ? e.textPreview().substring(0, 117) + "…" : e.textPreview());
    if ("client".equals(e.sender())) {
      notifier.notify(Role.ADMIN.name(), "admin", "message", e.orderId(),
          "Nouveau message", preview);
    } else {
      notifier.notify(Role.CLIENT.name(), e.clientId(), "message", e.orderId(),
          "Réponse de l'équipe", preview);
    }
    notifier.broadcastOrder(e.orderId(), "/messages", e);
  }

  @EventListener
  public void onBookingRequested(BookingRequested e) {
    notifier.notify(Role.ADMIN.name(), "admin", "booking", null,
        "Appel demandé", e.date() + " " + e.time());
  }

  @EventListener
  public void onBookingConfirmed(BookingConfirmed e) {
    notifier.notify(Role.CLIENT.name(), e.clientId(), "booking", null,
        "Créneau confirmé", e.date() + " " + e.time());
  }

  @EventListener
  public void onChangeRequestSubmitted(ChangeRequestSubmitted e) {
    notifier.notify(Role.ADMIN.name(), "admin", "change_request", e.orderId(),
        "Demande de modification", e.type());
  }

  @EventListener
  public void onChangeRequestHandled(ChangeRequestHandled e) {
    notifier.notify(Role.CLIENT.name(), e.clientId(), "change_request", e.orderId(),
        "Demande prise en compte", "L'équipe a traité votre demande.");
  }

  @EventListener
  public void onStageChanged(StageChanged e) {
    broadcastAdmin("stage", e.orderId(), e.fromStage() + " → " + e.toStage());
  }

  private void broadcastAdmin(String kind, String orderId, String note) {
    notifier.broadcastAdmins("/admin/board", new BoardEvent(kind, orderId, note));
  }

  /** Lightweight broadcast payload; consumed by the admin kanban panel. */
  public record BoardEvent(String kind, String orderId, String note) {
    public List<String> fields() { return List.of(kind, orderId, note); }
  }
}

package ma.rox.api.ws;

import java.time.OffsetDateTime;
import java.util.Map;
import ma.rox.api.auth.ClientRepo;
import ma.rox.api.error.ApiException;
import ma.rox.api.notification.NotificationService;
import ma.rox.api.portal.Message;
import ma.rox.api.portal.Order;
import ma.rox.api.portal.OrderRepo;
import ma.rox.api.portal.PortalService;
import ma.rox.api.security.RoxPrincipal;
import ma.rox.api.security.Role;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

/**
 * STOMP message handlers used by the realtime per-order chat (Phase 5).
 *
 *   /app/orders/{id}/messages/send  — persists via PortalService, then the
 *                                      MessagePostedEvent listener broadcasts
 *                                      the row to /topic/orders/{id}/messages
 *                                      (and fans out the notification bell).
 *   /app/orders/{id}/typing         — ephemeral presence ping; no DB write.
 */
@Controller
public class ChatSocketController {

  private final PortalService portal;
  private final OrderRepo orders;
  private final ClientRepo clients;
  private final NotificationService notifier;

  public ChatSocketController(PortalService portal, OrderRepo orders, ClientRepo clients,
                              NotificationService notifier) {
    this.portal = portal;
    this.orders = orders;
    this.clients = clients;
    this.notifier = notifier;
  }

  public record SendPayload(String text, String clientId) {}

  public record TypingPayload(String userId, String name, boolean typing) {}

  @MessageMapping("/orders/{orderId}/messages/send")
  public void sendOrderMessage(@DestinationVariable String orderId, @Payload SendPayload body,
                                java.security.Principal principal) {
    if (principal == null) throw ApiException.unauthorized("Session requise.");
    if (!(principal instanceof StompPrincipal sp)) throw ApiException.unauthorized("Session requise.");
    RoxPrincipal p = sp.rox();
    Order o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Commande"));
    if (o.getClient() == null) {
      throw ApiException.badRequest("Aucun client associé à cette demande.");
    }
    String sender = p.role() == Role.ADMIN ? "rep" : "client";
    String clientId = p.role() == Role.ADMIN ? o.getClient().getId() : p.id();
    if (p.role() == Role.CLIENT && !o.getClient().getId().equals(p.id())) {
      throw ApiException.forbidden();
    }
    // Reuse the REST path so event publishing + notification fanout are uniform.
    // PortalService.sendMessage also broadcasts to the client-scoped chat room.
    portal.sendMessage(clientId, sender, body.text(), orderId);
  }

  @MessageMapping("/orders/{orderId}/typing")
  public void typing(@DestinationVariable String orderId, @Payload TypingPayload body,
                      java.security.Principal principal) {
    if (principal == null) return;
    if (!(principal instanceof StompPrincipal sp)) return;
    RoxPrincipal p = sp.rox();
    String name = p.role() == Role.ADMIN
        ? "Conseiller ROX"
        : clients.findById(p.id()).map(c -> c.getName()).orElse("Client");
    TypingPayload echo = new TypingPayload(p.id(), name, body.typing());
    notifier.broadcastOrder(orderId, "/typing", echo);
  }

  /**
   * Client-scoped typing ping. The app's live chat threads are keyed by client
   * (not by order), so both panels join `/topic/chats/{clientId}/typing`. Admins
   * may target any thread; a client may only echo into their own.
   */
  @MessageMapping("/chats/{clientId}/typing")
  public void typingInChat(@DestinationVariable String clientId, @Payload TypingPayload body,
                            java.security.Principal principal) {
    if (!(principal instanceof StompPrincipal sp)) return;
    RoxPrincipal p = sp.rox();
    if (p.role() == Role.CLIENT && !p.id().equals(clientId)) return; // ignore cross-talk
    String name = p.role() == Role.ADMIN
        ? "Conseiller ROX"
        : clients.findById(p.id()).map(c -> c.getName()).orElse("Client");
    TypingPayload echo = new TypingPayload(p.id(), name, body.typing());
    notifier.broadcastChat(clientId, "/typing", echo);
  }

  /** STOMP-specific error surface; broadcast a timestamped no-op so clients can log. */
  @MessageExceptionHandler(Exception.class)
  public Map<String, Object> onError(Exception ex) {
    return Map.of(
        "error", ex.getMessage() == null ? "Erreur inconnue." : ex.getMessage(),
        "at", OffsetDateTime.now().toString());
  }
}

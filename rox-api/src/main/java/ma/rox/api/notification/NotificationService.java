package ma.rox.api.notification;

import static ma.rox.api.common.IdGen.prefixed;

import java.time.OffsetDateTime;
import java.util.List;
import ma.rox.api.security.RoxPrincipal;
import ma.rox.api.security.Role;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Persists a notification row and pushes it to `/user/queue/notifications`. */
@Service
public class NotificationService {

  private final NotificationRepo repo;
  private final SimpMessagingTemplate ws;

  public NotificationService(NotificationRepo repo, SimpMessagingTemplate ws) {
    this.repo = repo;
    this.ws = ws;
  }

  @Transactional
  public Notification notify(String role, String recipientId, String kind, String orderId,
                              String title, String body) {
    return notify(role, recipientId, kind, orderId, null, title, body);
  }

  @Transactional
  public Notification notify(String role, String recipientId, String kind, String orderId,
                              String clientId, String title, String body) {
    Notification n = new Notification();
    n.setId(prefixed("n"));
    n.setRecipientRole(role);
    n.setRecipientId(recipientId);
    n.setKind(kind);
    n.setOrderId(orderId);
    n.setClientId(clientId);
    n.setTitle(title);
    n.setBody(body);
    n.setCreatedAt(OffsetDateTime.now());
    repo.save(n);
    push(role, recipientId, n);
    return n;
  }

  /** Broadcast over STOMP. Principal name is `role:id` (see StompAuthChannelInterceptor). */
  private void push(String role, String recipientId, Notification n) {
    try {
      ws.convertAndSendToUser(principalName(role, recipientId), "/queue/notifications", n);
    } catch (RuntimeException ignored) {
      // Push is best-effort; the row is durable regardless.
    }
  }

  public static String principalName(String role, String id) { return role + ":" + id; }

  public static String principalName(RoxPrincipal p) {
    return principalName(p.role().name(), recipientIdFor(p));
  }

  /**
   * Resolves the persisted recipient id for a principal. The API models a single
   * seeded admin, so every ADMIN notification is addressed to the sentinel
   * `"admin"` (matching {@code NotificationListener}); the connected admin's
   * STOMP principal and REST queries both normalize to the same key. Clients are
   * addressed by their real account id.
   */
  public static String recipientIdFor(RoxPrincipal p) {
    return p.role() == Role.ADMIN ? "admin" : p.id();
  }

  public List<Notification> list(RoxPrincipal p, boolean unreadOnly, int limit) {
    PageRequest pr = PageRequest.of(0, Math.max(1, Math.min(limit, 100)));
    String rid = recipientIdFor(p);
    return unreadOnly
        ? repo.findByRecipientRoleAndRecipientIdAndReadAtIsNullOrderByCreatedAtDesc(
            p.role().name(), rid, pr)
        : repo.findByRecipientRoleAndRecipientIdOrderByCreatedAtDesc(
            p.role().name(), rid, pr);
  }

  public long unreadCount(RoxPrincipal p) {
    return repo.countByRecipientRoleAndRecipientIdAndReadAtIsNull(p.role().name(), recipientIdFor(p));
  }

  @Transactional
  public void markRead(RoxPrincipal p, String id) {
    String rid = recipientIdFor(p);
    repo.findById(id).filter(n ->
        n.getRecipientRole().equals(p.role().name()) && n.getRecipientId().equals(rid))
      .ifPresent(n -> { n.setReadAt(OffsetDateTime.now()); repo.save(n); });
  }

  @Transactional
  public int markAllRead(RoxPrincipal p) {
    return repo.markAllRead(p.role().name(), recipientIdFor(p));
  }

  /** Mark a subset read by kind and (optionally) owning client, for unread-badge sync. */
  @Transactional
  public int markAllRead(RoxPrincipal p, String kind, String clientId) {
    return repo.markAllReadByKind(p.role().name(), recipientIdFor(p), kind, clientId);
  }

  @Transactional
  public void delete(RoxPrincipal p, String id) {
    String rid = recipientIdFor(p);
    repo.findById(id).filter(n ->
        n.getRecipientRole().equals(p.role().name()) && n.getRecipientId().equals(rid))
      .ifPresent(repo::delete);
  }

  /** Convenience: broadcast to every logged-in ADMIN (used by Phase 6 board live updates). */
  public void broadcastAdmins(String destination, Object payload) {
    ws.convertAndSend("/topic" + destination, payload);
  }

  /** Broadcast for a per-order chat topic. */
  public void broadcastOrder(String orderId, String suffix, Object payload) {
    ws.convertAndSend("/topic/orders/" + orderId + suffix, payload);
  }

  /** Broadcast for the client-scoped chat room (typing presence; the app's live
   *  chat threads are keyed by client, not by order). */
  public void broadcastChat(String clientId, String suffix, Object payload) {
    ws.convertAndSend("/topic/chats/" + clientId + suffix, payload);
  }

  /** Static guard to keep the Role enum in sync with the recipient_role column. */
  public static String roleCode(Role r) { return r.name(); }
}

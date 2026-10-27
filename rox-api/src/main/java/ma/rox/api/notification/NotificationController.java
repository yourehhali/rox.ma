package ma.rox.api.notification;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import ma.rox.api.error.ApiException;
import ma.rox.api.security.CurrentUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

  private final NotificationService svc;
  private final CurrentUser me;

  public NotificationController(NotificationService svc, CurrentUser me) {
    this.svc = svc;
    this.me = me;
  }

  public record View(
      String id, String kind, String orderId, String title, String body,
      @JsonInclude(JsonInclude.Include.NON_NULL) String readAt, String createdAt) {
    public static View of(Notification n) {
      String r = n.getReadAt() == null ? null : n.getReadAt().toString();
      return new View(n.getId(), n.getKind(), n.getOrderId(), n.getTitle(), n.getBody(),
          r, n.getCreatedAt().toString());
    }
  }

  public record UnreadResponse(long unread) {}

  @GetMapping
  public List<View> list(
      @RequestParam(name = "unread", defaultValue = "false") boolean unread,
      @RequestParam(name = "limit", defaultValue = "50") int limit) {
    return svc.list(me.require(), unread, limit).stream().map(View::of).toList();
  }

  @GetMapping("/unread-count")
  public UnreadResponse unread() { return new UnreadResponse(svc.unreadCount(me.require())); }

  @PatchMapping("/{id}/read")
  public void read(@PathVariable String id) {
    me.require();
    svc.markRead(me.require(), id);
  }

  @PostMapping("/mark-all-read")
  public UnreadResponse markAll(
      @RequestParam(name = "kind", required = false) String kind,
      @RequestParam(name = "clientId", required = false) String clientId) {
    var p = me.require();
    int affected = (kind == null && clientId == null)
        ? svc.markAllRead(p)
        : svc.markAllRead(p, kind, clientId);
    return new UnreadResponse(affected);
  }

  @DeleteMapping("/{id}")
  public void remove(@PathVariable String id) {
    var p = me.require();
    svc.delete(p, id);
    // no-op delete of foreign id is silently accepted (204) — nothing to signal back.
  }

  /** Prevents Spring from mapping a null-principal call anywhere in the module. */
  @ExceptionHandler(IllegalStateException.class)
  public ApiException handleIllegal(IllegalStateException ex) {
    return ApiException.forbidden();
  }
}

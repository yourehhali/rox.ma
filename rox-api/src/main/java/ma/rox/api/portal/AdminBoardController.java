package ma.rox.api.portal;

import static ma.rox.api.common.IdGen.prefixed;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import ma.rox.api.auth.ClientAccount;
import ma.rox.api.error.ApiException;
import ma.rox.api.events.Events;
import ma.rox.api.notification.NotificationService;
import ma.rox.api.security.CurrentUser;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Admin kanban board surface: full board snapshot + optimistic stage PATCH. */
@RestController
@RequestMapping("/admin/board")
public class AdminBoardController {

  /** Six columns per the plan; ARCHIVED is terminal. */
  public static final Set<String> STAGES =
      Set.of("LEAD", "ONBOARDING", "PRODUCTION", "REVIEW", "DELIVERED", "ARCHIVED");

  private final OrderRepo orders;
  private final StageHistoryRepo history;
  private final CurrentUser me;
  private final ApplicationEventPublisher events;
  private final NotificationService notifier;

  public AdminBoardController(OrderRepo orders, StageHistoryRepo history, CurrentUser me,
                              ApplicationEventPublisher events, NotificationService notifier) {
    this.orders = orders;
    this.history = history;
    this.me = me;
    this.events = events;
    this.notifier = notifier;
  }

  public record StagePatch(
      @NotBlank @Pattern(regexp = "LEAD|ONBOARDING|PRODUCTION|REVIEW|DELIVERED|ARCHIVED",
          message = "Stage inconnu") String stage) {}

  public record Card(
      String id, String title, String service, String description, String budget, String deadline,
      String phase, String status, String stage, String createdAt,
      String clientId, String clientName, String clientEmail) {}

  @GetMapping
  public List<Card> board() {
    return orders.findAllByOrderByCreatedAtDesc().stream().map(AdminBoardController::toCard).toList();
  }

  @GetMapping("/{orderId}/history")
  public List<HistoryEntry> historyOf(@PathVariable String orderId) {
    return history.findByOrderIdOrderByChangedAtDesc(orderId).stream()
        .map(h -> new HistoryEntry(h.getId(), h.getFromStage(), h.getToStage(),
            h.getChangedBy(), h.getChangedAt().toString()))
        .toList();
  }

  public record HistoryEntry(String id, String fromStage, String toStage,
                              String changedBy, String changedAt) {}

  @Transactional
  @PatchMapping("/{orderId}/stage")
  public Card setStage(@PathVariable String orderId, @Valid @RequestBody StagePatch body) {
    Order o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Commande"));
    String from = o.getStage() == null ? "LEAD" : o.getStage();
    String to = body.stage();
    if (from.equals(to)) return toCard(o);
    o.setStage(to);
    orders.save(o);

    StageHistory h = new StageHistory();
    h.setId(prefixed("sh"));
    h.setOrder(o);
    h.setFromStage(from);
    h.setToStage(to);
    h.setChangedBy(me.require().id());
    h.setChangedAt(OffsetDateTime.now());
    history.save(h);

    events.publishEvent(new Events.StageChanged(o.getId(),
        o.getClient() == null ? null : o.getClient().getId(), from, to, me.require().id()));
    notifier.broadcastAdmins("/admin/board",
        new ma.rox.api.events.NotificationListener.BoardEvent("stage", o.getId(), from + " → " + to));
    return toCard(o);
  }

  private static Card toCard(Order o) {
    ClientAccount c = o.getClient();
    return new Card(o.getId(), o.getTitle(), o.getService(), o.getDescription(), o.getBudget(),
        o.getDeadline(), o.getPhase(), o.getStatus(),
        o.getStage() == null ? "LEAD" : o.getStage(),
        o.getCreatedAt().toString(),
        c == null ? null : c.getId(),
        c == null ? o.getClientName() : c.getName(),
        c == null ? o.getClientEmail() : c.getEmail());
  }
}

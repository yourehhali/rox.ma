package ma.rox.api.portal;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import ma.rox.api.ai.UiPromptService;
import ma.rox.api.error.ApiException;
import ma.rox.api.portal.PortalDtos.*;
import ma.rox.api.security.CurrentUser;
import ma.rox.api.security.Role;
import ma.rox.api.security.RoxPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
public class OrdersController {

  private final PortalService svc;
  private final CurrentUser me;
  private final UiPromptService uiPrompts;

  public OrdersController(PortalService svc, CurrentUser me, UiPromptService uiPrompts) {
    this.svc = svc;
    this.me = me;
    this.uiPrompts = uiPrompts;
  }

  @GetMapping
  public List<?> list() {
    RoxPrincipal p = me.require();
    if (p.role() == Role.ADMIN) {
      return svc.listAllOrders().stream().map(svc::toAdminDto).toList();
    }
    return svc.listOrdersForClient(p.id()).stream().map(svc::toDto).toList();
  }

  @PostMapping
  public ResponseEntity<OrderDto> create(@Valid @RequestBody NewOrderInput input) {
    RoxPrincipal p = me.requireClient();
    Order o = svc.createOrder(p.id(), input);
    return ResponseEntity.status(HttpStatus.CREATED).body(svc.toDto(o));
  }

  /**
   * Admin: (re)run the AI triage for one order — verdict on the brief plus the
   * copy-ready Lovable/Trae UI prompt. Runs inline (a Gemini hop, a few seconds);
   * returns the refreshed admin view of the order.
   */
  @PostMapping("/{id}/ui-prompt")
  public AdminOrderDto regenerateUiPrompt(@PathVariable String id) {
    me.requireAdmin();
    Order o = svc.requireOrder(id);
    uiPrompts.triage(o.getId());
    return svc.toAdminDto(svc.requireOrder(id));
  }

  /**
   * Public lead capture: no account required. Stores an unclaimed lead keyed by
   * the WhatsApp phone. The client then requests a login code out-of-band
   * (/auth/client/otp) and verifies it to claim this lead onto their new
   * account. Kept free of OTP delivery so a retry never duplicates the lead.
   */
  @PostMapping("/guest")
  public ResponseEntity<OrderDto> createGuest(@Valid @RequestBody GuestOrderRequest input) {
    Order o = svc.createGuestOrder(input);
    return ResponseEntity.status(HttpStatus.CREATED).body(svc.toDto(o));
  }

  @GetMapping("/{id}")
  public OrderDto get(@PathVariable String id) {
    Order o = svc.requireOrder(id);
    requireAccessible(o);
    return svc.toDto(o);
  }

  @PatchMapping("/{id}/phase")
  public OrderDto patchPhase(@PathVariable String id, @RequestBody Map<String, String> body) {
    me.requireAdmin();
    String phase = body.get("phase");
    if (phase == null || phase.isBlank()) {
      throw ApiException.badRequest("Champ 'phase' requis.", List.of(new ma.rox.api.error.ApiError.FieldIssue("phase", "required")));
    }
    Order o = svc.advancePhase(id, phase);
    return svc.toDto(o);
  }

  @PatchMapping("/{id}/status")
  public OrderDto patchStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
    me.requireAdmin();
    String status = body.get("status");
    if (status == null || status.isBlank()) {
      throw ApiException.badRequest("Champ 'status' requis.", List.of(new ma.rox.api.error.ApiError.FieldIssue("status", "required")));
    }
    return svc.toDto(svc.setStatus(id, status));
  }

  @PostMapping("/{id}/tasks/{taskId}/toggle")
  public OrderDto toggleTask(@PathVariable String id, @PathVariable String taskId) {
    me.requireAdmin();
    return svc.toDto(svc.toggleTask(id, taskId));
  }

  /** Admin-defined steps: the client journey beyond the initial call is composed here. */
  @PostMapping("/{id}/tasks")
  public OrderDto addTask(@PathVariable String id, @RequestBody Map<String, String> body) {
    me.requireAdmin();
    return svc.toDto(svc.addTask(id, body.get("label")));
  }

  @DeleteMapping("/{id}/tasks/{taskId}")
  public OrderDto removeTask(@PathVariable String id, @PathVariable String taskId) {
    me.requireAdmin();
    return svc.toDto(svc.removeTask(id, taskId));
  }

  @PostMapping("/{id}/requests")
  public ResponseEntity<ChangeRequestDto> addRequest(@PathVariable String id, @RequestBody Map<String, String> body) {
    RoxPrincipal p = me.requireClient();
    Order existing = svc.requireOrder(id);
    if (existing.getClient() == null || !existing.getClient().getId().equals(p.id())) {
      throw ApiException.forbidden();
    }
    String type = body.getOrDefault("type", "update");
    String note = body.getOrDefault("note", "");
    ChangeRequest r = svc.addRequest(id, type, note);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(new ChangeRequestDto(r.getId(), r.getType(), r.getNote(),
            ma.rox.api.common.IdGen.iso(r.getAt()), r.getStatus()));
  }

  @PostMapping("/{id}/requests/{requestId}/handle")
  public ChangeRequestDto handleRequest(@PathVariable String id, @PathVariable String requestId) {
    me.requireAdmin();
    ChangeRequest r = svc.handleRequest(id, requestId);
    return new ChangeRequestDto(r.getId(), r.getType(), r.getNote(),
        ma.rox.api.common.IdGen.iso(r.getAt()), r.getStatus());
  }

  private void requireAccessible(Order o) {
    RoxPrincipal p = me.require();
    if (p.role() == Role.ADMIN) return;
    if (o.getClient() == null || !o.getClient().getId().equals(p.id())) throw ApiException.forbidden();
  }
}

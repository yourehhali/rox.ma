package ma.rox.api.portal;

import jakarta.validation.Valid;
import java.util.List;
import ma.rox.api.error.ApiException;
import ma.rox.api.portal.PortalDtos.MessageDto;
import ma.rox.api.portal.PortalDtos.SendMessageRequest;
import ma.rox.api.security.CurrentUser;
import ma.rox.api.security.Role;
import ma.rox.api.security.RoxPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/messages")
public class MessagesController {

  private final PortalService svc;
  private final CurrentUser me;

  public MessagesController(PortalService svc, CurrentUser me) {
    this.svc = svc;
    this.me = me;
  }

  @GetMapping
  public List<MessageDto> list(@RequestParam(required = false) String clientId) {
    RoxPrincipal p = me.require();
    if (p.role() == Role.ADMIN) {
      String target = clientId != null ? clientId : null;
      if (target == null) return List.of();
      return svc.listMessagesForClient(target).stream().map(svc::toDto).toList();
    }
    return svc.listMessagesForClient(p.id()).stream().map(svc::toDto).toList();
  }

  @PostMapping
  public ResponseEntity<MessageDto> send(
      @RequestParam(name = "clientId", required = false) String adminClientId,
      @Valid @RequestBody SendMessageRequest req) {
    RoxPrincipal p = me.require();
    String clientId;
    String sender;
    if (p.role() == Role.CLIENT) {
      clientId = p.id();
      sender = "client";
    } else {
      if (adminClientId == null && req.orderId() == null) {
        throw ApiException.badRequest("'clientId' ou 'orderId' requis pour un message admin.",
            List.of(new ma.rox.api.error.ApiError.FieldIssue("clientId", "required")));
      }
      sender = "rep";
      clientId = adminClientId != null
          ? adminClientId
          : svc.requireOrder(req.orderId()).getClient().getId();
    }
    Message m = svc.sendMessage(clientId, sender, req.text(), req.orderId());
    return ResponseEntity.status(HttpStatus.CREATED).body(svc.toDto(m));
  }
}

package ma.rox.api.portal;

import jakarta.validation.Valid;
import java.util.List;
import ma.rox.api.portal.PortalDtos.AdminBookingDto;
import ma.rox.api.portal.PortalDtos.BookCallRequest;
import ma.rox.api.portal.PortalDtos.CallBookingDto;
import ma.rox.api.security.CurrentUser;
import ma.rox.api.security.Role;
import ma.rox.api.security.RoxPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/bookings")
public class BookingsController {

  private final PortalService svc;
  private final CurrentUser me;

  public BookingsController(PortalService svc, CurrentUser me) {
    this.svc = svc;
    this.me = me;
  }

  @GetMapping
  public List<?> list() {
    RoxPrincipal p = me.require();
    if (p.role() == Role.ADMIN) {
      return svc.listAllBookings().stream().map(svc::toAdminDto).toList();
    }
    return svc.listBookingsForClient(p.id()).stream().map(svc::toDto).toList();
  }

  @PostMapping
  public ResponseEntity<CallBookingDto> book(@Valid @RequestBody BookCallRequest req) {
    RoxPrincipal p = me.requireClient();
    CallBooking b = svc.book(p.id(), req.date(), req.time(), req.subject());
    return ResponseEntity.status(HttpStatus.CREATED).body(svc.toDto(b));
  }

  @PostMapping("/{id}/confirm")
  public AdminBookingDto confirm(@PathVariable String id) {
    me.requireAdmin();
    return svc.toAdminDto(svc.confirmBooking(id));
  }
}

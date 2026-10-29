package ma.rox.api.auth;

import jakarta.validation.Valid;
import ma.rox.api.security.CurrentUser;
import ma.rox.api.security.RoxPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthService svc;
  private final CurrentUser me;

  public AuthController(AuthService svc, CurrentUser me) {
    this.svc = svc;
    this.me = me;
  }

  // --- Client: WhatsApp number + OTP only (no email, no password) -----------

  /** Start login: issue an OTP and send it over WhatsApp (synchronous). */
  @PostMapping("/client/otp")
  public ResponseEntity<Void> clientOtp(@Valid @RequestBody AuthDtos.OtpStartRequest req) {
    svc.sendLoginOtp(req.phone());
    return ResponseEntity.accepted().build();
  }

  /** Alias for retrying the code; identical to /client/otp. */
  @PostMapping("/client/resend")
  public ResponseEntity<Void> clientResend(@Valid @RequestBody AuthDtos.OtpStartRequest req) {
    svc.sendLoginOtp(req.phone());
    return ResponseEntity.accepted().build();
  }

  /** Verify the code and return a client session. */
  @PostMapping("/client/verify")
  public AuthDtos.AuthSessionDto clientVerify(@Valid @RequestBody AuthDtos.OtpVerifyRequest req) {
    return svc.verifyClientOtp(req.phone(), req.code());
  }

  @PostMapping("/client/refresh")
  public AuthDtos.AuthSessionDto clientRefresh(@Valid @RequestBody AuthDtos.RefreshRequest req) {
    return svc.clientRefresh(req.refreshToken());
  }

  @PostMapping("/client/logout")
  public ResponseEntity<Void> clientLogout() {
    RoxPrincipal p = me.require();
    svc.clientLogout(p.id());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/client/me")
  public AuthDtos.ClientUserDto clientMe() {
    return svc.clientMe(me.requireClient().id());
  }

  // --- Admin: email + password (unchanged) ---------------------------------

  @PostMapping("/admin/login")
  public AuthDtos.AdminAuthSessionDto adminLogin(@Valid @RequestBody AuthDtos.LoginRequest req) {
    return svc.adminLogin(req);
  }

  @PostMapping("/admin/refresh")
  public AuthDtos.AdminAuthSessionDto adminRefresh(@Valid @RequestBody AuthDtos.RefreshRequest req) {
    return svc.adminRefresh(req.refreshToken());
  }

  @PostMapping("/admin/logout")
  public ResponseEntity<Void> adminLogout() {
    RoxPrincipal p = me.require();
    svc.adminLogout(p.email());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/admin/me")
  public AuthDtos.AdminUserDto adminMe() {
    return svc.adminMe(me.requireAdmin().id());
  }
}

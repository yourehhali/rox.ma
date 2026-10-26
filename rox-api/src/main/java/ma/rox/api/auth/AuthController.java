package ma.rox.api.auth;

import jakarta.validation.Valid;
import ma.rox.api.security.CurrentUser;
import ma.rox.api.security.RoxPrincipal;
import org.springframework.http.HttpStatus;
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

  @PostMapping("/client/signup")
  public ResponseEntity<AuthDtos.AuthSessionDto> clientSignup(@Valid @RequestBody AuthDtos.ClientSignupRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(svc.clientSignup(req));
  }

  @PostMapping("/client/login")
  public AuthDtos.AuthSessionDto clientLogin(@Valid @RequestBody AuthDtos.LoginRequest req) {
    return svc.clientLogin(req);
  }

  @PostMapping("/client/refresh")
  public AuthDtos.AuthSessionDto clientRefresh(@Valid @RequestBody AuthDtos.RefreshRequest req) {
    return svc.clientRefresh(req.refreshToken());
  }

  @PostMapping("/client/logout")
  public ResponseEntity<Void> clientLogout() {
    RoxPrincipal p = me.require();
    svc.clientLogout(p.email());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/client/me")
  public AuthDtos.ClientUserDto clientMe() {
    return svc.clientMe(me.requireClient().id());
  }

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

package ma.rox.api.auth;

import static ma.rox.api.common.IdGen.*;

import java.util.Optional;
import ma.rox.api.error.ApiException;
import ma.rox.api.security.JwtService;
import ma.rox.api.security.RoxPrincipal;
import ma.rox.api.security.Role;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private final ClientRepo clients;
  private final AdminRepo admins;
  private final RefreshTokenRepo tokens;
  private final PasswordEncoder encoder;
  private final JwtService jwt;

  public AuthService(ClientRepo clients, AdminRepo admins, RefreshTokenRepo tokens,
                     PasswordEncoder encoder, JwtService jwt) {
    this.clients = clients;
    this.admins = admins;
    this.tokens = tokens;
    this.encoder = encoder;
    this.jwt = jwt;
  }

  @Transactional
  public AuthDtos.AuthSessionDto clientSignup(AuthDtos.ClientSignupRequest req) {
    if (clients.existsByEmailIgnoreCase(req.email())) {
      throw ApiException.conflict("Un compte existe déjà avec cet email.");
    }
    ClientAccount c = new ClientAccount();
    c.setId(prefixed("c"));
    c.setName(req.name().trim());
    c.setEmail(req.email().trim().toLowerCase());
    c.setPasswordHash(encoder.encode(req.password()));
    c.setCreatedAt(nowUtc());
    clients.save(c);

    RoxPrincipal p = new RoxPrincipal(c.getId(), c.getEmail(), Role.CLIENT);
    return new AuthDtos.AuthSessionDto(
        issueAccess(p), issueRefresh(p, Role.CLIENT, c.getEmail()),
        jwt.accessTtl().toSeconds(), toClientDto(c));
  }

  @Transactional
  public AuthDtos.AuthSessionDto clientLogin(AuthDtos.LoginRequest req) {
    ClientAccount c = clients.findByEmailIgnoreCase(req.email())
        .orElseThrow(() -> ApiException.unauthorized("Email ou mot de passe incorrect."));
    if (!encoder.matches(req.password(), c.getPasswordHash())) {
      throw ApiException.unauthorized("Email ou mot de passe incorrect.");
    }
    RoxPrincipal p = new RoxPrincipal(c.getId(), c.getEmail(), Role.CLIENT);
    return new AuthDtos.AuthSessionDto(
        issueAccess(p), issueRefresh(p, Role.CLIENT, c.getEmail()),
        jwt.accessTtl().toSeconds(), toClientDto(c));
  }

  @Transactional
  public void clientLogout(String email) {
    tokens.deleteBySubject(email.toLowerCase());
  }

  public AuthDtos.ClientUserDto clientMe(String id) {
    return clients.findById(id).map(AuthService::toClientDto)
        .orElseThrow(() -> ApiException.notFound("Compte client"));
  }

  @Transactional
  public AuthDtos.AdminAuthSessionDto adminLogin(AuthDtos.LoginRequest req) {
    AdminAccount a = admins.findByEmailIgnoreCase(req.email())
        .orElseThrow(() -> ApiException.unauthorized("Email ou mot de passe incorrect."));
    if (!encoder.matches(req.password(), a.getPasswordHash())) {
      throw ApiException.unauthorized("Email ou mot de passe incorrect.");
    }
    RoxPrincipal p = new RoxPrincipal(a.getId(), a.getEmail(), Role.ADMIN);
    return new AuthDtos.AdminAuthSessionDto(
        issueAccess(p), issueRefresh(p, Role.ADMIN, a.getEmail()),
        jwt.accessTtl().toSeconds(), toAdminDto(a));
  }

  @Transactional
  public void adminLogout(String email) {
    tokens.deleteBySubject(email.toLowerCase());
  }

  public AuthDtos.AdminUserDto adminMe(String id) {
    return admins.findById(id).map(AuthService::toAdminDto)
        .orElseThrow(() -> ApiException.notFound("Compte admin"));
  }

  public Optional<ClientAccount> findClient(String id) { return clients.findById(id); }

  /**
   * Rotate a refresh token: verify it, delete the old jti row, issue a new access+refresh pair.
   * Throws 401 if the token is expired / invalid / revoked / wrong type / wrong audience.
   */
  @Transactional
  public AuthDtos.AuthSessionDto clientRefresh(String refreshToken) {
    JwtService.DecodedToken d = consume(refreshToken, Role.CLIENT);
    ClientAccount c = clients.findByEmailIgnoreCase(d.principal().email())
        .orElseThrow(() -> ApiException.unauthorized("Session expirée."));
    RoxPrincipal p = new RoxPrincipal(c.getId(), c.getEmail(), Role.CLIENT);
    return new AuthDtos.AuthSessionDto(
        issueAccess(p), issueRefresh(p, Role.CLIENT, c.getEmail()),
        jwt.accessTtl().toSeconds(), toClientDto(c));
  }

  @Transactional
  public AuthDtos.AdminAuthSessionDto adminRefresh(String refreshToken) {
    JwtService.DecodedToken d = consume(refreshToken, Role.ADMIN);
    AdminAccount a = admins.findByEmailIgnoreCase(d.principal().email())
        .orElseThrow(() -> ApiException.unauthorized("Session expirée."));
    RoxPrincipal p = new RoxPrincipal(a.getId(), a.getEmail(), Role.ADMIN);
    return new AuthDtos.AdminAuthSessionDto(
        issueAccess(p), issueRefresh(p, Role.ADMIN, a.getEmail()),
        jwt.accessTtl().toSeconds(), toAdminDto(a));
  }

  /** Parses, verifies type=refresh + role matches, ensures the row exists, then rotates (delete). */
  private JwtService.DecodedToken consume(String refreshToken, Role expectedRole) {
    JwtService.DecodedToken d;
    try {
      d = jwt.parse(refreshToken, JwtService.TYPE_REFRESH);
    } catch (RuntimeException ex) {
      throw ApiException.unauthorized("Session expirée.");
    }
    if (d.principal().role() != expectedRole) {
      throw ApiException.unauthorized("Session expirée.");
    }
    RefreshToken row = tokens.findByJtiAndRevokedFalse(d.jti())
        .orElseThrow(() -> ApiException.unauthorized("Session expirée."));
    tokens.delete(row);
    return d;
  }

  private String issueAccess(RoxPrincipal p) {
    return jwt.issueAccess(p, jti());
  }

  private String issueRefresh(RoxPrincipal p, Role role, String email) {
    String jti = jti();
    RefreshToken t = new RefreshToken();
    t.setJti(jti);
    t.setSubject(email.toLowerCase());
    t.setRole(role.name());
    t.setExpiresAt(nowUtc().plus(jwt.refreshTtl()));
    t.setRevoked(false);
    tokens.save(t);
    return jwt.issueRefresh(p, jti);
  }

  public static AuthDtos.ClientUserDto toClientDto(ClientAccount c) {
    return new AuthDtos.ClientUserDto(c.getId(), c.getName(), c.getEmail(), iso(c.getCreatedAt()));
  }

  public static AuthDtos.AdminUserDto toAdminDto(AdminAccount a) {
    return new AuthDtos.AdminUserDto(a.getId(), a.getEmail(), a.getName(), iso(a.getCreatedAt()));
  }
}

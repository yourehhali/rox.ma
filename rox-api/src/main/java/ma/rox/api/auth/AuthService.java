package ma.rox.api.auth;

import static ma.rox.api.common.IdGen.*;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Optional;
import ma.rox.api.error.ApiException;
import ma.rox.api.error.ErrorCode;
import ma.rox.api.security.JwtService;
import ma.rox.api.security.RoxPrincipal;
import ma.rox.api.security.Role;
import org.springframework.beans.factory.annotation.Value;
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
  private final VerificationOrchestrator verifier;
  private final ma.rox.api.portal.PortalService portal;
  private final boolean verificationRequired;
  private final Duration gracePeriod;

  public AuthService(ClientRepo clients, AdminRepo admins, RefreshTokenRepo tokens,
                     PasswordEncoder encoder, JwtService jwt, VerificationOrchestrator verifier,
                     ma.rox.api.portal.PortalService portal,
                     @Value("${rox.verification.required:false}") boolean verificationRequired,
                     @Value("${rox.verification.grace-hours:24}") long graceHours) {
    this.clients = clients;
    this.admins = admins;
    this.tokens = tokens;
    this.encoder = encoder;
    this.jwt = jwt;
    this.verifier = verifier;
    this.portal = portal;
    this.verificationRequired = verificationRequired;
    this.gracePeriod = Duration.ofHours(graceHours);
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
    c.setPhone(normalizePhone(req.phone()));
    c.setPasswordHash(encoder.encode(req.password()));
    c.setCreatedAt(nowUtc());
    c.setVerified(false);
    clients.save(c);

    // Attach any guest leads this email left behind before registering.
    portal.claimLeadsForClient(c);

    // Best-effort OTP dispatch (email + WhatsApp) so signup never fails on a send hiccup.
    verifier.dispatchSignupBestEffort(c.getEmail(), c.getPhone(), c.getName());

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
    // Grace period lets existing accounts continue while verification is rolled out.
    if (verificationRequired && !c.isVerified()) {
      OffsetDateTime age = c.getCreatedAt() == null ? OffsetDateTime.now() : c.getCreatedAt();
      if (OffsetDateTime.now().minus(gracePeriod).isAfter(age)) {
        throw new ApiException(403, ErrorCode.forbidden,
            "Veuillez vérifier votre email avant de continuer.");
      }
    }
    // An existing account may have left a guest lead behind under this email.
    portal.claimLeadsForClient(c);
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
    return new AuthDtos.ClientUserDto(
        c.getId(), c.getName(), c.getEmail(), c.getPhone(),
        c.isVerified(), iso(c.getCreatedAt()));
  }

  public static AuthDtos.AdminUserDto toAdminDto(AdminAccount a) {
    return new AuthDtos.AdminUserDto(a.getId(), a.getEmail(), a.getName(), iso(a.getCreatedAt()));
  }

  /** Strip spaces / dashes / parens; keep leading +. Empty string → null. */
  private static String normalizePhone(String raw) {
    if (raw == null) return null;
    String t = raw.trim();
    if (t.isEmpty()) return null;
    boolean plus = t.startsWith("+");
    String digits = t.replaceAll("[^0-9]", "");
    return plus ? "+" + digits : digits;
  }
}

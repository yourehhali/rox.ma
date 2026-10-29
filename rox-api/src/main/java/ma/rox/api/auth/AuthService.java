package ma.rox.api.auth;

import static ma.rox.api.common.IdGen.*;

import java.time.OffsetDateTime;
import java.util.Optional;
import ma.rox.api.common.PhoneNumbers;
import ma.rox.api.error.ApiException;
import ma.rox.api.security.JwtService;
import ma.rox.api.security.RoxPrincipal;
import ma.rox.api.security.Role;
import ma.rox.api.whatsapp.WhatsAppOtpService;
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
  private final ma.rox.api.portal.PortalService portal;
  private final PhoneOtpService phoneOtp;
  private final WhatsAppOtpService whatsapp;

  public AuthService(ClientRepo clients, AdminRepo admins, RefreshTokenRepo tokens,
                     PasswordEncoder encoder, JwtService jwt,
                     ma.rox.api.portal.PortalService portal,
                     PhoneOtpService phoneOtp, WhatsAppOtpService whatsapp) {
    this.clients = clients;
    this.admins = admins;
    this.tokens = tokens;
    this.encoder = encoder;
    this.jwt = jwt;
    this.portal = portal;
    this.phoneOtp = phoneOtp;
    this.whatsapp = whatsapp;
  }

  /**
   * Issue a login OTP and deliver it over WhatsApp (synchronous, sole channel).
   * If the send fails the pending OTP is discarded so the visitor is not stuck
   * behind the 60s cooldown for a code that never arrived. Used by both the
   * "send code" and "resend" endpoints.
   */
  public void sendLoginOtp(String phoneRaw) {
    String phone = PhoneNumbers.normalize(phoneRaw);
    String code = phoneOtp.issue(phone);
    try {
      whatsapp.sendLoginCode(phone, code, PhoneOtpService.TTL_MINUTES);
    } catch (RuntimeException ex) {
      phoneOtp.discard(phone);
      throw ex;
    }
  }

  /**
   * Verify a WhatsApp login code, then find-or-create the client account keyed
   * on the normalized phone and return a fresh session. New accounts default
   * their name to the phone number (the admin edits it later) and are marked
   * verified. Any phone-matched guest lead is claimed onto the account.
   */
  @Transactional
  public AuthDtos.AuthSessionDto verifyClientOtp(String phoneRaw, String code) {
    String phone = PhoneNumbers.normalize(phoneRaw);
    phoneOtp.verify(phone, code);

    ClientAccount c = clients.findByPhone(phone).orElseGet(() -> {
      ClientAccount fresh = new ClientAccount();
      fresh.setId(prefixed("c"));
      fresh.setName(phone);
      fresh.setPhone(phone);
      fresh.setEmail(null);
      fresh.setPasswordHash(null);
      fresh.setCreatedAt(nowUtc());
      fresh.setVerified(true);
      fresh.setVerifiedAt(OffsetDateTime.now());
      clients.save(fresh);
      return fresh;
    });

    // Attach any guest leads this phone left behind before the account existed.
    portal.claimLeadsForClientByPhone(c);

    // Subject = account id (stable, non-null for WhatsApp-only accounts).
    RoxPrincipal p = new RoxPrincipal(c.getId(), c.getId(), Role.CLIENT);
    return new AuthDtos.AuthSessionDto(
        issueAccess(p), issueRefresh(p, Role.CLIENT, c.getId()),
        jwt.accessTtl().toSeconds(), toClientDto(c));
  }

  @Transactional
  public void clientLogout(String subjectId) {
    tokens.deleteBySubject(subjectId.toLowerCase());
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
    ClientAccount c = clients.findById(d.principal().id())
        .orElseThrow(() -> ApiException.unauthorized("Session expirée."));
    RoxPrincipal p = new RoxPrincipal(c.getId(), c.getId(), Role.CLIENT);
    return new AuthDtos.AuthSessionDto(
        issueAccess(p), issueRefresh(p, Role.CLIENT, c.getId()),
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

  private String issueRefresh(RoxPrincipal p, Role role, String subject) {
    String jti = jti();
    RefreshToken t = new RefreshToken();
    t.setJti(jti);
    t.setSubject(subject.toLowerCase());
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
}

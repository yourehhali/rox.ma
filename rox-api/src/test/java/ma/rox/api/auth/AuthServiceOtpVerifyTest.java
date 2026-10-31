package ma.rox.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Optional;
import ma.rox.api.portal.PortalService;
import ma.rox.api.security.JwtService;
import ma.rox.api.security.RoxPrincipal;
import ma.rox.api.security.Role;
import ma.rox.api.whatsapp.WhatsAppOtpService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * WhatsApp OTP login: verifying a code finds-or-creates the client account
 * keyed on the normalized phone, claims any phone-matched guest leads, and
 * returns a session whose subject is the account id (not an email, which these
 * accounts don't have).
 */
class AuthServiceOtpVerifyTest {

  private final ClientRepo clients = mock(ClientRepo.class);
  private final AdminRepo admins = mock(AdminRepo.class);
  private final RefreshTokenRepo tokens = mock(RefreshTokenRepo.class);
  private final PasswordEncoder encoder = mock(PasswordEncoder.class);
  private final JwtService jwt = mock(JwtService.class);
  private final PortalService portal = mock(PortalService.class);
  private final PhoneOtpService phoneOtp = mock(PhoneOtpService.class);
  private final WhatsAppOtpService whatsapp = mock(WhatsAppOtpService.class);
  private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);

  private final AuthService svc =
      new AuthService(clients, admins, tokens, encoder, jwt, portal, phoneOtp, whatsapp, events);

  private void stubTokens() {
    when(jwt.issueAccess(any(), anyString())).thenReturn("access");
    when(jwt.issueRefresh(any(), anyString())).thenReturn("refresh");
    when(jwt.accessTtl()).thenReturn(Duration.ofMinutes(15));
    when(jwt.refreshTtl()).thenReturn(Duration.ofDays(30));
  }

  @Test
  void newPhoneCreatesVerifiedAccountAndReturnsIdSubjectSession() {
    stubTokens();
    when(clients.findByPhone("+33600000000")).thenReturn(Optional.empty());

    AuthDtos.AuthSessionDto session = svc.verifyClientOtp("  +33 6 00 00 00 00 ", "123456");

    verify(phoneOtp).verify("+33600000000", "123456");

    ArgumentCaptor<ClientAccount> saved = ArgumentCaptor.forClass(ClientAccount.class);
    verify(clients).save(saved.capture());
    ClientAccount c = saved.getValue();
    assertThat(c.getPhone()).isEqualTo("+33600000000");
    assertThat(c.getName()).isEqualTo("+33600000000"); // defaults to phone
    assertThat(c.getEmail()).isNull();
    assertThat(c.getPasswordHash()).isNull();
    assertThat(c.isVerified()).isTrue();
    assertThat(c.getVerifiedAt()).isNotNull();

    verify(portal).claimLeadsForClientByPhone(c);

    // Session subject is the account id on both access + refresh sides.
    ArgumentCaptor<RoxPrincipal> principal = ArgumentCaptor.forClass(RoxPrincipal.class);
    verify(jwt).issueAccess(principal.capture(), anyString());
    assertThat(principal.getValue().id()).isEqualTo(c.getId());
    assertThat(principal.getValue().email()).isEqualTo(c.getId());
    assertThat(principal.getValue().role()).isEqualTo(Role.CLIENT);

    assertThat(session.accessToken()).isEqualTo("access");
    assertThat(session.refreshToken()).isEqualTo("refresh");
    assertThat(session.user().id()).isEqualTo(c.getId());
    assertThat(session.user().phone()).isEqualTo("+33600000000");
    assertThat(session.user().email()).isNull();
    assertThat(session.user().verified()).isTrue();

    // Signup alert for the admin WhatsApp notifier.
    verify(events).publishEvent(any(ma.rox.api.events.Events.ClientRegistered.class));
  }

  @Test
  void existingPhoneLinksAndClaimsLeadWithoutCreatingAccount() {
    stubTokens();
    ClientAccount existing = new ClientAccount();
    existing.setId("c_existing");
    existing.setName("Alice");
    existing.setPhone("+212600000000");
    existing.setVerified(true);
    existing.setCreatedAt(OffsetDateTime.now());
    when(clients.findByPhone("+212600000000")).thenReturn(Optional.of(existing));

    AuthDtos.AuthSessionDto session = svc.verifyClientOtp("+212600000000", "123456");

    verify(clients, never()).save(any());
    verify(events, never()).publishEvent(any(ma.rox.api.events.Events.ClientRegistered.class));
    verify(portal).claimLeadsForClientByPhone(existing);
    assertThat(session.user().id()).isEqualTo("c_existing");
    assertThat(session.user().name()).isEqualTo("Alice");
  }

  @Test
  void sendLoginOtpDiscardsCodeWhenWhatsAppDeliveryFails() {
    when(phoneOtp.issue("+33600000000")).thenReturn("123456");
    org.mockito.Mockito.doThrow(ma.rox.api.error.ApiException.badRequest("boom"))
        .when(whatsapp).sendLoginCode(eq("+33600000000"), eq("123456"), anyLong());

    try {
      svc.sendLoginOtp("+33600000000");
      org.junit.jupiter.api.Assertions.fail("expected the delivery failure to propagate");
    } catch (ma.rox.api.error.ApiException expected) {
      verify(phoneOtp).discard("+33600000000"); // cooldown cleared so the visitor can retry
    }
  }

  @Test
  void sendLoginOtpKeepsCodeOnSuccessfulDelivery() {
    when(phoneOtp.issue("+33600000000")).thenReturn("123456");

    svc.sendLoginOtp("+33600000000");

    verify(whatsapp).sendLoginCode("+33600000000", "123456", PhoneOtpService.TTL_MINUTES);
    verify(phoneOtp, never()).discard(anyString());
  }
}

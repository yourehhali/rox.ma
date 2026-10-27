package ma.rox.api.auth;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import ma.rox.api.error.ApiException;
import ma.rox.api.whatsapp.WhatsAppOtpService;
import org.junit.jupiter.api.Test;

/**
 * The orchestrator turns one issued OTP into deliveries on both channels. Email
 * is always dispatched; WhatsApp receives the SAME code (its own enabled/phone
 * gating lives inside {@link WhatsAppOtpService}).
 */
class VerificationOrchestratorTest {

  @Test
  void dispatchesSameCodeToEmailAndWhatsapp() {
    EmailVerificationService otp = mock(EmailVerificationService.class);
    EmailService email = mock(EmailService.class);
    WhatsAppOtpService whatsapp = mock(WhatsAppOtpService.class);
    ClientRepo clients = mock(ClientRepo.class);
    when(otp.issueOtp("a@b.c", EmailVerificationService.PURPOSE_SIGNUP)).thenReturn("123456");

    new VerificationOrchestrator(otp, email, whatsapp, clients)
        .dispatchSignup("a@b.c", "+33600000000", "Bob");

    verify(email).send(eq("a@b.c"), anyString(), eq("Votre code ROX : 123456"), anyString());
    verify(whatsapp)
        .sendSignupCode("+33600000000", "123456", EmailVerificationService.TTL_MINUTES, "Bob");
  }

  @Test
  void resendResolvesPhoneFromStoredClient() {
    EmailVerificationService otp = mock(EmailVerificationService.class);
    EmailService email = mock(EmailService.class);
    WhatsAppOtpService whatsapp = mock(WhatsAppOtpService.class);
    ClientRepo clients = mock(ClientRepo.class);

    ClientAccount c = new ClientAccount();
    c.setEmail("a@b.c");
    c.setPhone("+212600000000");
    c.setName("Bob");
    when(clients.findByEmailIgnoreCase("a@b.c")).thenReturn(java.util.Optional.of(c));
    when(otp.issueOtp("a@b.c", EmailVerificationService.PURPOSE_SIGNUP)).thenReturn("654321");

    new VerificationOrchestrator(otp, email, whatsapp, clients).resend("a@b.c");

    verify(whatsapp)
        .sendSignupCode("+212600000000", "654321", EmailVerificationService.TTL_MINUTES, "Bob");
  }

  @Test
  void bestEffortSwallowsCooldownApiException() {
    EmailVerificationService otp = mock(EmailVerificationService.class);
    EmailService email = mock(EmailService.class);
    WhatsAppOtpService whatsapp = mock(WhatsAppOtpService.class);
    ClientRepo clients = mock(ClientRepo.class);
    when(otp.issueOtp(anyString(), anyString())).thenThrow(ApiException.badRequest("cooldown"));

    // Must not propagate the cooldown so account creation never fails on dispatch.
    new VerificationOrchestrator(otp, email, whatsapp, clients)
        .dispatchSignupBestEffort("a@b.c", "+33600000000", "Bob");

    verifyNoInteractions(email);
    verifyNoInteractions(whatsapp);
  }
}

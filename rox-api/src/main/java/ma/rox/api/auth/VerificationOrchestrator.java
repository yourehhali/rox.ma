package ma.rox.api.auth;

import ma.rox.api.error.ApiException;
import ma.rox.api.whatsapp.WhatsAppOtpService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * The single place that turns "send a signup code to this user" into deliveries
 * on every active channel. Generates ONE OTP (via {@link
 * EmailVerificationService#issueOtp}) then emails it and, when WhatsApp is
 * enabled and configured, sends the SAME code over WhatsApp. Verification stays
 * email-keyed; WhatsApp is delivery only.
 */
@Service
public class VerificationOrchestrator {

  private static final Logger log = LoggerFactory.getLogger(VerificationOrchestrator.class);

  private final EmailVerificationService otp;
  private final EmailService email;
  private final WhatsAppOtpService whatsapp;
  private final ClientRepo clients;

  public VerificationOrchestrator(EmailVerificationService otp, EmailService email,
                                  WhatsAppOtpService whatsapp, ClientRepo clients) {
    this.otp = otp;
    this.email = email;
    this.whatsapp = whatsapp;
    this.clients = clients;
  }

  /**
   * Resend the signup code to an existing account across every channel. The
   * phone/name are read from the stored client so the caller only needs the
   * email. Surfaces the 60s cooldown {@link ApiException} to the user.
   */
  public void resend(String emailAddr) {
    ClientAccount c = clients.findByEmailIgnoreCase(emailAddr)
        .orElseThrow(() -> ApiException.notFound("Compte client"));
    dispatchSignup(c.getEmail(), c.getPhone(), c.getName());
  }

  /**
   * Issue a signup code and dispatch it to email + WhatsApp. Throws
   * {@link ApiException} on the 60s resend cooldown — callers that must never
   * fail (signup) catch it; the resend endpoint lets it surface to the user.
   */
  public void dispatchSignup(String emailAddr, String phone, String name) {
    String code = otp.issueOtp(emailAddr, EmailVerificationService.PURPOSE_SIGNUP);
    long minutes = EmailVerificationService.TTL_MINUTES;

    String subject = "ROX — code de vérification";
    this.email.send(emailAddr, subject, "Votre code ROX : " + code, renderHtml(code, minutes));

    // Async + best-effort internally; never blocks or breaks the request.
    this.whatsapp.sendSignupCode(phone, code, minutes, name);
  }

  /** Signup wrapper: dispatch best-effort so account creation never fails on send errors. */
  public void dispatchSignupBestEffort(String emailAddr, String phone, String name) {
    try {
      dispatchSignup(emailAddr, phone, name);
    } catch (ApiException ignored) {
      log.warn("Signup OTP dispatch skipped for {} ({})", emailAddr, ignored.getMessage());
    } catch (RuntimeException ex) {
      log.error("Signup OTP dispatch failed for {}", emailAddr, ex);
    }
  }

  private static String renderHtml(String code, long minutes) {
    return "<div style='font-family:system-ui,sans-serif;max-width:520px'>"
        + "<h2 style='color:#E31B23;margin:0 0 12px'>ROX Agency</h2>"
        + "<p>Votre code de vérification est :</p>"
        + "<p style='font-size:32px;letter-spacing:6px;font-weight:700;color:#111827;margin:16px 0'>"
        + code + "</p>"
        + "<p style='color:#6b7280'>Il expire dans " + minutes + " minutes. "
        + "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>"
        + "</div>";
  }
}

package ma.rox.api.auth;

import static ma.rox.api.common.IdGen.prefixed;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Optional;
import ma.rox.api.error.ApiException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Issues and validates single-use numeric OTPs for email verification.
 *
 * Rules:
 *   - 6-digit crypto-random code, BCrypt-hashed at rest.
 *   - 15-minute TTL.
 *   - Max 3 verification attempts per OTP before it burns.
 *   - 60-second resend cooldown enforced via `sent_at`.
 */
@Service
public class EmailVerificationService {

  public static final String PURPOSE_SIGNUP = "signup";
  private static final Duration TTL = Duration.ofMinutes(15);
  private static final Duration COOLDOWN = Duration.ofSeconds(60);
  private static final int MAX_ATTEMPTS = 3;
  private static final SecureRandom RNG = new SecureRandom();

  private final EmailVerificationRepo repo;
  private final ClientRepo clients;
  private final PasswordEncoder encoder;
  private final EmailService mailer;

  public EmailVerificationService(EmailVerificationRepo repo, ClientRepo clients,
                                  PasswordEncoder encoder, EmailService mailer) {
    this.repo = repo;
    this.clients = clients;
    this.encoder = encoder;
    this.mailer = mailer;
  }

  /** Generate + persist + email a fresh OTP. Returns plaintext code only for tests. */
  @Transactional
  public String issueOtp(String emailRaw, String purpose) {
    String email = emailRaw.trim().toLowerCase();
    Optional<EmailVerification> latest = repo
        .findFirstByEmailAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(email, purpose);
    if (latest.isPresent() && latest.get().getSentAt().isAfter(OffsetDateTime.now().minus(COOLDOWN))) {
      throw ApiException.badRequest("Veuillez patienter avant de demander un nouveau code.");
    }
    // Burn any older unconsumed rows for the same (email, purpose).
    repo.deleteByEmailAndPurposeAndConsumedAtIsNull(email, purpose);

    String code = String.format("%06d", RNG.nextInt(1_000_000));
    EmailVerification row = new EmailVerification();
    row.setId(prefixed("otp"));
    row.setEmail(email);
    row.setCodeHash(encoder.encode(code));
    row.setPurpose(purpose);
    OffsetDateTime now = OffsetDateTime.now();
    row.setSentAt(now);
    row.setExpiresAt(now.plus(TTL));
    row.setAttempts(0);
    repo.save(row);

    String subject = "ROX — code de vérification";
    String html = renderHtml(code, TTL.toMinutes());
    mailer.send(email, subject, "Votre code ROX : " + code, html);
    return code;
  }

  /** Validate a submitted OTP and mark the owning client account as verified. */
  @Transactional
  public void verify(String emailRaw, String code) {
    String email = emailRaw.trim().toLowerCase();
    EmailVerification row = repo.findFirstByEmailAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(email, PURPOSE_SIGNUP)
        .orElseThrow(() -> ApiException.badRequest("Code invalide ou expiré."));
    if (row.getExpiresAt().isBefore(OffsetDateTime.now())) {
      throw ApiException.badRequest("Code expiré. Demandez-en un nouveau.");
    }
    if (row.getAttempts() >= MAX_ATTEMPTS) {
      throw ApiException.badRequest("Trop de tentatives. Demandez un nouveau code.");
    }
    if (!encoder.matches(code, row.getCodeHash())) {
      row.setAttempts(row.getAttempts() + 1);
      repo.save(row);
      throw ApiException.badRequest("Code invalide.");
    }
    row.setConsumedAt(OffsetDateTime.now());
    repo.save(row);

    ClientAccount c = clients.findByEmailIgnoreCase(email)
        .orElseThrow(() -> ApiException.notFound("Compte client"));
    c.setVerified(true);
    c.setVerifiedAt(OffsetDateTime.now());
    clients.save(c);
  }

  /** Convenience for signup: called after account creation, best-effort. */
  public void issueForSignup(String email) {
    try {
      issueOtp(email, PURPOSE_SIGNUP);
    } catch (ApiException ignored) {
      // Signup just happened — cooldown cannot be in effect; swallow unexpected issues
      // so signup never fails on an SMTP/DB hiccup.
    } catch (RuntimeException ex) {
      // Log via mailer already handles SMTP failures; DB / RNG failures are swallowed here.
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

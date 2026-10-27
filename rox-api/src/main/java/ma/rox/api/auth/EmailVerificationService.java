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
  public static final long TTL_MINUTES = 15;
  private static final Duration TTL = Duration.ofMinutes(TTL_MINUTES);
  private static final Duration COOLDOWN = Duration.ofSeconds(60);
  private static final int MAX_ATTEMPTS = 3;
  private static final SecureRandom RNG = new SecureRandom();

  private final EmailVerificationRepo repo;
  private final ClientRepo clients;
  private final PasswordEncoder encoder;

  public EmailVerificationService(EmailVerificationRepo repo, ClientRepo clients,
                                  PasswordEncoder encoder) {
    this.repo = repo;
    this.clients = clients;
    this.encoder = encoder;
  }

  /**
   * Generate + persist a fresh single-use OTP and return the plaintext code.
   * This is now delivery-agnostic: it does NOT email/send the code. Callers go
   * through {@link VerificationOrchestrator} which fans the code out to email
   * and (when configured) WhatsApp. Cooldown and burn-old-rows stay here so the
   * rate rules apply regardless of channel.
   */
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
}

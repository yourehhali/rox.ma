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
 * Phone-keyed single-use OTP for WhatsApp client login. Mirrors
 * {@link EmailVerificationService}'s rate rules (cooldown, expiry, attempt cap,
 * bcrypt-hashed code) but is delivery-agnostic: it only issues/validates the
 * code, it never sends it. Callers go through the controller which pushes the
 * code over WhatsApp and calls {@link #discard} if the send fails so the
 * cooldown is never consumed on an undeliverable number.
 */
@Service
public class PhoneOtpService {

  public static final String PURPOSE_LOGIN = "login";
  public static final long TTL_MINUTES = 15;
  private static final Duration TTL = Duration.ofMinutes(TTL_MINUTES);
  private static final Duration COOLDOWN = Duration.ofSeconds(60);
  private static final int MAX_ATTEMPTS = 3;
  private static final SecureRandom RNG = new SecureRandom();

  private final PhoneVerificationRepo repo;
  private final PasswordEncoder encoder;

  public PhoneOtpService(PhoneVerificationRepo repo, PasswordEncoder encoder) {
    this.repo = repo;
    this.encoder = encoder;
  }

  /** Generate + persist a fresh OTP and return the plaintext code. Honours the cooldown. */
  @Transactional
  public String issue(String phoneRaw) {
    String phone = ma.rox.api.common.PhoneNumbers.normalize(phoneRaw);
    Optional<PhoneVerification> latest = repo
        .findFirstByPhoneAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(phone, PURPOSE_LOGIN);
    if (latest.isPresent() && latest.get().getSentAt().isAfter(OffsetDateTime.now().minus(COOLDOWN))) {
      throw ApiException.badRequest("Veuillez patienter avant de demander un nouveau code.");
    }
    // Burn any older unconsumed rows for the same phone.
    repo.deleteByPhoneAndPurposeAndConsumedAtIsNull(phone, PURPOSE_LOGIN);

    String code = String.format("%06d", RNG.nextInt(1_000_000));
    PhoneVerification row = new PhoneVerification();
    row.setId(prefixed("potp"));
    row.setPhone(phone);
    row.setCodeHash(encoder.encode(code));
    row.setPurpose(PURPOSE_LOGIN);
    OffsetDateTime now = OffsetDateTime.now();
    row.setSentAt(now);
    row.setExpiresAt(now.plus(TTL));
    row.setAttempts(0);
    repo.save(row);
    return code;
  }

  /**
   * Clear the pending (unconsumed) OTP for a phone. Used when the WhatsApp send
   * fails so the visitor can immediately retry without waiting out the cooldown.
   */
  @Transactional
  public void discard(String phoneRaw) {
    String phone = ma.rox.api.common.PhoneNumbers.normalize(phoneRaw);
    repo.deleteByPhoneAndPurposeAndConsumedAtIsNull(phone, PURPOSE_LOGIN);
  }

  /** Validate a submitted OTP and mark it consumed. Does not touch the account. */
  @Transactional
  public void verify(String phoneRaw, String code) {
    String phone = ma.rox.api.common.PhoneNumbers.normalize(phoneRaw);
    PhoneVerification row = repo
        .findFirstByPhoneAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(phone, PURPOSE_LOGIN)
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
  }
}

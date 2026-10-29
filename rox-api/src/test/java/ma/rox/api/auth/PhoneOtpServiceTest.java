package ma.rox.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.Optional;
import ma.rox.api.error.ApiException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Phone-keyed login OTP rules: cooldown, old-row burning, single-use verify,
 * expiry and the attempt cap. Delivery is out of scope (the controller pushes
 * the returned code over WhatsApp), so a mocked repo stands in for persistence
 * while a real {@link BCryptPasswordEncoder} exercises the hash/match paths.
 */
class PhoneOtpServiceTest {

  private final PhoneVerificationRepo repo = mock(PhoneVerificationRepo.class);
  private final PasswordEncoder encoder = new BCryptPasswordEncoder();
  private final PhoneOtpService svc = new PhoneOtpService(repo, encoder);

  /** Build an unconsumed row as {@code issue} would, but with a caller-supplied code hash. */
  private PhoneVerification row(String plainCode, OffsetDateTime expiresAt, int attempts) {
    PhoneVerification r = new PhoneVerification();
    r.setId("potp_1");
    r.setPhone("+33600000000");
    r.setCodeHash(encoder.encode(plainCode));
    r.setPurpose(PhoneOtpService.PURPOSE_LOGIN);
    r.setSentAt(OffsetDateTime.now());
    r.setExpiresAt(expiresAt);
    r.setAttempts(attempts);
    return r;
  }

  @Test
  void issuePersistsHashedSixDigitCodeAndNormalizesPhone() {
    when(repo.findFirstByPhoneAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(
        any(), eq(PhoneOtpService.PURPOSE_LOGIN))).thenReturn(Optional.empty());

    String code = svc.issue("  +33 6 00 00 00 00 ");

    assertThat(code).matches("[0-9]{6}");
    ArgumentCaptor<PhoneVerification> saved = ArgumentCaptor.forClass(PhoneVerification.class);
    verify(repo).save(saved.capture());
    PhoneVerification r = saved.getValue();
    assertThat(r.getPhone()).isEqualTo("+33600000000");
    assertThat(r.getPurpose()).isEqualTo(PhoneOtpService.PURPOSE_LOGIN);
    assertThat(r.getAttempts()).isZero();
    assertThat(r.getConsumedAt()).isNull();
    assertThat(r.getExpiresAt()).isAfter(OffsetDateTime.now());
    // Stored as a bcrypt hash, not the plaintext, but it still matches.
    assertThat(r.getCodeHash()).isNotEqualTo(code);
    assertThat(encoder.matches(code, r.getCodeHash())).isTrue();
  }

  @Test
  void issueBurnsPreviousUnconsumedRows() {
    when(repo.findFirstByPhoneAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(
        any(), eq(PhoneOtpService.PURPOSE_LOGIN))).thenReturn(Optional.empty());

    svc.issue("+33600000000");

    verify(repo).deleteByPhoneAndPurposeAndConsumedAtIsNull("+33600000000", PhoneOtpService.PURPOSE_LOGIN);
  }

  @Test
  void issueHonoursCooldownAndDoesNotBurnWhenRecent() {
    PhoneVerification recent = row("123456", OffsetDateTime.now().plusMinutes(15), 0);
    recent.setSentAt(OffsetDateTime.now()); // just sent, inside the 60s window
    when(repo.findFirstByPhoneAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(
        any(), eq(PhoneOtpService.PURPOSE_LOGIN))).thenReturn(Optional.of(recent));

    assertThatThrownBy(() -> svc.issue("+33600000000"))
        .isInstanceOf(ApiException.class);

    verify(repo, never()).save(any());
    verify(repo, never()).deleteByPhoneAndPurposeAndConsumedAtIsNull(any(), any());
  }

  @Test
  void verifyMarksRowConsumedOnMatch() {
    PhoneVerification r = row("123456", OffsetDateTime.now().plusMinutes(10), 0);
    when(repo.findFirstByPhoneAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(
        any(), eq(PhoneOtpService.PURPOSE_LOGIN))).thenReturn(Optional.of(r));

    svc.verify("+33600000000", "123456");

    ArgumentCaptor<PhoneVerification> saved = ArgumentCaptor.forClass(PhoneVerification.class);
    verify(repo).save(saved.capture());
    assertThat(saved.getValue().getConsumedAt()).isNotNull();
  }

  @Test
  void verifyRejectsExpiredCode() {
    PhoneVerification r = row("123456", OffsetDateTime.now().minusMinutes(1), 0);
    when(repo.findFirstByPhoneAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(
        any(), eq(PhoneOtpService.PURPOSE_LOGIN))).thenReturn(Optional.of(r));

    assertThatThrownBy(() -> svc.verify("+33600000000", "123456"))
        .isInstanceOf(ApiException.class);

    verify(repo, never()).save(any());
  }

  @Test
  void verifyRejectsAfterMaxAttempts() {
    PhoneVerification r = row("123456", OffsetDateTime.now().plusMinutes(10), 3);
    when(repo.findFirstByPhoneAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(
        any(), eq(PhoneOtpService.PURPOSE_LOGIN))).thenReturn(Optional.of(r));

    assertThatThrownBy(() -> svc.verify("+33600000000", "123456"))
        .isInstanceOf(ApiException.class);

    verify(repo, never()).save(any());
  }

  @Test
  void verifyIncrementsAttemptsOnWrongCode() {
    PhoneVerification r = row("123456", OffsetDateTime.now().plusMinutes(10), 0);
    when(repo.findFirstByPhoneAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(
        any(), eq(PhoneOtpService.PURPOSE_LOGIN))).thenReturn(Optional.of(r));

    assertThatThrownBy(() -> svc.verify("+33600000000", "000000"))
        .isInstanceOf(ApiException.class);

    ArgumentCaptor<PhoneVerification> saved = ArgumentCaptor.forClass(PhoneVerification.class);
    verify(repo).save(saved.capture());
    assertThat(saved.getValue().getAttempts()).isEqualTo(1);
    assertThat(saved.getValue().getConsumedAt()).isNull();
  }

  @Test
  void verifyRejectsWhenNoPendingRow() {
    when(repo.findFirstByPhoneAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(
        any(), eq(PhoneOtpService.PURPOSE_LOGIN))).thenReturn(Optional.empty());

    assertThatThrownBy(() -> svc.verify("+33600000000", "123456"))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void discardClearsPendingRow() {
    svc.discard("+33600000000");
    verify(repo).deleteByPhoneAndPurposeAndConsumedAtIsNull("+33600000000", PhoneOtpService.PURPOSE_LOGIN);
  }
}

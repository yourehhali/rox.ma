package ma.rox.api.auth;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationRepo extends JpaRepository<EmailVerification, String> {
  Optional<EmailVerification> findFirstByEmailAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(
      String email, String purpose);

  List<EmailVerification> findByEmailAndPurposeAndConsumedAtIsNull(String email, String purpose);

  long countByEmailAndPurposeAndSentAtAfter(String email, String purpose, OffsetDateTime after);

  void deleteByEmailAndPurposeAndConsumedAtIsNull(String email, String purpose);
}

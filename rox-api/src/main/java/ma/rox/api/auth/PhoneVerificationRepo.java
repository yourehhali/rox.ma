package ma.rox.api.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhoneVerificationRepo extends JpaRepository<PhoneVerification, String> {
  Optional<PhoneVerification> findFirstByPhoneAndPurposeAndConsumedAtIsNullOrderBySentAtDesc(
      String phone, String purpose);

  void deleteByPhoneAndPurposeAndConsumedAtIsNull(String phone, String purpose);
}

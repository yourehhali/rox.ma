package ma.rox.api.auth;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Single-use OTP row backing WhatsApp (phone-keyed) client login. */
@Entity
@Table(name = "phone_verification")
@Getter @Setter @NoArgsConstructor
public class PhoneVerification {
  @Id private String id;
  @Column(nullable = false) private String phone;
  @Column(name = "code_hash", nullable = false) private String codeHash;
  /** login */
  @Column(nullable = false) private String purpose;
  @Column(name = "sent_at", nullable = false) private OffsetDateTime sentAt;
  @Column(name = "expires_at", nullable = false) private OffsetDateTime expiresAt;
  @Column(nullable = false) private int attempts = 0;
  @Column(name = "consumed_at") private OffsetDateTime consumedAt;
}

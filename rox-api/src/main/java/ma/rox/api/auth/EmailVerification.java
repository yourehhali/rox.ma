package ma.rox.api.auth;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Single-use OTP row backing email verification / password reset / change-email flows. */
@Entity
@Table(name = "email_verification")
@Getter @Setter @NoArgsConstructor
public class EmailVerification {
  @Id private String id;
  @Column(nullable = false) private String email;
  @Column(name = "code_hash", nullable = false) private String codeHash;
  /** signup | reset | change-email */
  @Column(nullable = false) private String purpose;
  @Column(name = "sent_at", nullable = false) private OffsetDateTime sentAt;
  @Column(name = "expires_at", nullable = false) private OffsetDateTime expiresAt;
  @Column(nullable = false) private int attempts = 0;
  @Column(name = "consumed_at") private OffsetDateTime consumedAt;
}

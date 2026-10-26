package ma.rox.api.auth;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "refresh_token")
@Getter @Setter @NoArgsConstructor
public class RefreshToken {
  @Id private String jti;
  @Column(nullable = false) private String subject;
  @Column(nullable = false) private String role;
  @Column(name = "expires_at", nullable = false) private OffsetDateTime expiresAt;
  @Column(nullable = false) private boolean revoked;
}

package ma.rox.api.auth;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "client_account")
@Getter @Setter @NoArgsConstructor
public class ClientAccount {
  @Id @Column(name = "id") private String id;
  @Column(nullable = false) private String name;
  @Column(nullable = false, unique = true) private String email;
  @Column(name = "password_hash", nullable = false) private String passwordHash;
  @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;
  @Column(name = "phone") private String phone;
  @Column(name = "verified", nullable = false) private boolean verified = false;
  @Column(name = "verified_at") private OffsetDateTime verifiedAt;
}

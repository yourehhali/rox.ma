package ma.rox.api.auth;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "admin_account")
@Getter @Setter @NoArgsConstructor
public class AdminAccount {
  @Id @Column(name = "id") private String id;
  @Column(nullable = false, unique = true) private String email;
  @Column(name = "password_hash", nullable = false) private String passwordHash;
  private String name;
  @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;
}

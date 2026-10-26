package ma.rox.api.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepo extends JpaRepository<RefreshToken, String> {
  Optional<RefreshToken> findByJtiAndRevokedFalse(String jti);
  void deleteBySubject(String subject);
}

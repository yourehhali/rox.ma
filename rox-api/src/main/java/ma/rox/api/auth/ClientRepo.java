package ma.rox.api.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientRepo extends JpaRepository<ClientAccount, String> {
  Optional<ClientAccount> findByEmailIgnoreCase(String email);
  boolean existsByEmailIgnoreCase(String email);
}

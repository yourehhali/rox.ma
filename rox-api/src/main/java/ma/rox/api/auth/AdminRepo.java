package ma.rox.api.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepo extends JpaRepository<AdminAccount, String> {
  Optional<AdminAccount> findByEmailIgnoreCase(String email);
}

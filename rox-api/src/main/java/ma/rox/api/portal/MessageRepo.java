package ma.rox.api.portal;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepo extends JpaRepository<Message, String> {
  List<Message> findByClientIdOrderByAtAsc(String clientId);
  List<Message> findAllByOrderByAtAsc();
}

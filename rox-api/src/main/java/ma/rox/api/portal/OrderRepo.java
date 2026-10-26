package ma.rox.api.portal;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrderRepo extends JpaRepository<Order, String> {
  List<Order> findByClientIdOrderByCreatedAtDesc(String clientId);
  List<Order> findAllByOrderByCreatedAtDesc();
  long countByClientId(String clientId);
  long countByStatus(String status);

  @Query("select o from Order o where o.status = 'active'")
  List<Order> findActive();

  @Query("select count(r) from ChangeRequest r where r.status = 'ouvert'")
  long countOpenRequests();
}

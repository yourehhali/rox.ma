package ma.rox.api.portal;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepo extends JpaRepository<CallBooking, String> {
  List<CallBooking> findByClientIdOrderByDateAsc(String clientId);
  List<CallBooking> findAllByOrderByDateAsc();
  List<CallBooking> findByStatusOrderByDateAsc(String status);
}

package ma.rox.api.portal;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StageHistoryRepo extends JpaRepository<StageHistory, String> {
  List<StageHistory> findByOrderIdOrderByChangedAtDesc(String orderId);
}

package ma.rox.api.analytics;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrafficRepo extends JpaRepository<TrafficPoint, String> {
  List<TrafficPoint> findAllByOrderByYearAscMonthAsc();
}

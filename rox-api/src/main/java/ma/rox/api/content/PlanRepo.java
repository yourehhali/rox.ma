package ma.rox.api.content;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanRepo extends JpaRepository<Plan, String> {
  List<Plan> findAllByOrderByPositionAsc();
}

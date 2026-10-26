package ma.rox.api.content;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FaqRepo extends JpaRepository<FaqGroup, String> {
  List<FaqGroup> findAllByOrderByPositionAsc();
}

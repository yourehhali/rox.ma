package ma.rox.api.content;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRepo extends JpaRepository<CatalogService, String> {
  Optional<CatalogService> findBySlug(String slug);
  boolean existsBySlug(String slug);
  List<CatalogService> findAllByOrderByPositionAsc();
  List<CatalogService> findByPublishedTrueOrderByPositionAsc();
}

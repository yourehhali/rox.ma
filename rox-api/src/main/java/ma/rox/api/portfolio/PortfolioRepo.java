package ma.rox.api.portfolio;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PortfolioRepo extends JpaRepository<PortfolioItem, String> {
  @Query("select p from PortfolioItem p where p.published = true order by p.featured desc, p.createdAt desc")
  List<PortfolioItem> findPublished(Pageable pageable);

  @Query("select p from PortfolioItem p order by p.featured desc, p.createdAt desc")
  List<PortfolioItem> findAllOrdered();
}

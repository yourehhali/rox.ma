package ma.rox.api.portfolio;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "portfolio_item")
@Getter @Setter @NoArgsConstructor
public class PortfolioItem {
  @Id private String id;
  @Column(nullable = false) private String title;
  @Column(nullable = false) private String client;
  @Column(nullable = false) private String sector;
  @Column(nullable = false) private String service;
  @Column(nullable = false) private String city;
  @Column(nullable = false) private String summary;
  @Column(nullable = false) private String result;

  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "tags", columnDefinition = "text[]")
  private List<String> tags = new ArrayList<>();

  @Column(name = "color_a", nullable = false) private String colorA;
  @Column(name = "color_b", nullable = false) private String colorB;
  @Column(nullable = false) private boolean featured;
  @Column(nullable = false) private boolean published;
  @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;
}

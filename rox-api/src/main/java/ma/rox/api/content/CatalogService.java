package ma.rox.api.content;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "service_content")
@Getter @Setter @NoArgsConstructor
public class CatalogService {
  @Id private String id;
  @Column(nullable = false, unique = true) private String slug;
  @Column(nullable = false) private String name;
  @Column(nullable = false) private String tag;
  @Column(nullable = false) private String icon;
  @Column(name = "short", nullable = false) private String shortDesc;
  @Column(name = "faq_key", nullable = false) private String faqKey;
  @Column(nullable = false) private boolean published;
  @Column(nullable = false) private String eyebrow;
  @Column(nullable = false) private String title;
  @Column(nullable = false) private String lead;
  @Column(nullable = false) private String heading;
  @Column(nullable = false, columnDefinition = "text") private String subtext;
  @Column(name = "price_label", nullable = false) private String priceLabel;
  @Column(name = "price_value", nullable = false) private String priceValue;
  @Column(nullable = false) private int position;

  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "points", columnDefinition = "text[]")
  private List<String> points = new ArrayList<>();

  @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @OrderBy("position ASC")
  private List<ServiceExtra> extras = new ArrayList<>();
}

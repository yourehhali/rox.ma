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
@Table(name = "plan")
@Getter @Setter @NoArgsConstructor
public class Plan {
  @Id private String id;
  @Column(nullable = false) private String name;
  @Column(nullable = false) private String price;
  @Column(nullable = false) private String unit;
  @Column(nullable = false, columnDefinition = "text") private String description;
  @Column(nullable = false) private boolean highlight;
  @Column(nullable = false) private int position;

  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "features", columnDefinition = "text[]")
  private List<String> features = new ArrayList<>();
}

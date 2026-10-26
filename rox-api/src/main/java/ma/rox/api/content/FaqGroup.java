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
@Table(name = "faq_group")
@Getter @Setter @NoArgsConstructor
public class FaqGroup {
  @Id @Column(name = "name") private String name;
  @Column(nullable = false) private int position;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "items", nullable = false, columnDefinition = "jsonb")
  private List<FaqItemValue> items = new ArrayList<>();
}

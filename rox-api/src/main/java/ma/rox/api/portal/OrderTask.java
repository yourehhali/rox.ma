package ma.rox.api.portal;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "order_task")
@Getter @Setter @NoArgsConstructor
public class OrderTask {
  @Id private String id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id") private Order order;

  @Column(nullable = false) private String label;
  @Column(nullable = false) private boolean done;
  @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;
  @Column(nullable = false) private int position;
}

package ma.rox.api.portal;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "stage_history")
@Getter @Setter @NoArgsConstructor
public class StageHistory {
  @Id private String id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id") private Order order;
  @Column(name = "from_stage") private String fromStage;
  @Column(name = "to_stage", nullable = false) private String toStage;
  @Column(name = "changed_by", nullable = false) private String changedBy;
  @Column(name = "changed_at", nullable = false) private OffsetDateTime changedAt;
}

package ma.rox.api.portal;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "change_request")
@Getter @Setter @NoArgsConstructor
public class ChangeRequest {
  @Id private String id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id") private Order order;

  @Column(nullable = false) private String type;   // update | edit
  @Column(nullable = false) private String note;
  @Column(nullable = false) private OffsetDateTime at;
  @Column(nullable = false) private String status; // ouvert | pris en compte
}

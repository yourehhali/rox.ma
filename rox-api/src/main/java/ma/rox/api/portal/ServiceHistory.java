package ma.rox.api.portal;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "service_history")
@Getter @Setter @NoArgsConstructor
public class ServiceHistory {
  @Id private String id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id") private Order order;

  @Column(nullable = false) private String service;
  @Column(nullable = false) private String year;
  @Column(nullable = false) private String outcome;
}

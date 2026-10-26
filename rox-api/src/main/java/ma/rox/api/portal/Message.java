package ma.rox.api.portal;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.rox.api.auth.ClientAccount;

@Entity
@Table(name = "message")
@Getter @Setter @NoArgsConstructor
public class Message {
  @Id private String id;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "client_id") private ClientAccount client;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "order_id") private Order order;

  @Column(nullable = false) private OffsetDateTime at;
  @Column(nullable = false) private String sender; // client | rep
  @Column(nullable = false) private String text;
}

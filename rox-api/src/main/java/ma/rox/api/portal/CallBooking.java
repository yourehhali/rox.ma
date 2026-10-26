package ma.rox.api.portal;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.rox.api.auth.ClientAccount;

@Entity
@Table(name = "call_booking")
@Getter @Setter @NoArgsConstructor
public class CallBooking {
  @Id private String id;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "client_id") private ClientAccount client;

  @Column(name = "book_date", nullable = false) private LocalDate date;
  @Column(name = "book_time", nullable = false) private LocalTime time;
  @Column(nullable = false) private String subject;
  @Column(nullable = false) private String status; // demandé | confirmé
}

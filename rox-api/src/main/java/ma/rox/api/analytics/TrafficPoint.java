package ma.rox.api.analytics;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "traffic_point")
@Getter @Setter @NoArgsConstructor
public class TrafficPoint {
  @Id private String id;
  @Column(nullable = false) private String month;
  @Column(nullable = false) private int year;
  @Column(nullable = false) private int views;
  @Column(nullable = false) private int contacts;
}

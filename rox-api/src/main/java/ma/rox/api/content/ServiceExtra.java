package ma.rox.api.content;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "service_extra")
@Getter @Setter @NoArgsConstructor
public class ServiceExtra {
  @Id private String id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "service_id") private CatalogService service;

  @Column(nullable = false) private String title;
  @Column(nullable = false, columnDefinition = "text") private String text;
  @Column(nullable = false) private int position;
}

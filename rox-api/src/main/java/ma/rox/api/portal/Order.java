package ma.rox.api.portal;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.rox.api.auth.ClientAccount;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor
public class Order {
  @Id private String id;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "client_id")
  private ClientAccount client;

  @Column(nullable = false) private String title;
  @Column(nullable = false) private String service;
  @Column(nullable = false) private String description;
  @Column(nullable = false) private String budget;
  @Column(nullable = false) private String deadline;
  @Column(nullable = false) private String phase;
  @Column(nullable = false) private String status;
  @Column(name = "stage", nullable = false) private String stage = "LEAD";
  @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @OrderBy("position ASC")
  private List<OrderTask> tasks = new ArrayList<>();

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @OrderBy("at DESC")
  private List<OrderEvent> events = new ArrayList<>();

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @OrderBy("at DESC")
  private List<ChangeRequest> requests = new ArrayList<>();

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  private List<ServiceHistory> history = new ArrayList<>();
}

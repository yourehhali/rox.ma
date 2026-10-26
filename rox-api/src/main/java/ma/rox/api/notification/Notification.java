package ma.rox.api.notification;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "notification")
@Getter @Setter @NoArgsConstructor
public class Notification {
  @Id private String id;
  /** ADMIN | CLIENT */
  @Column(name = "recipient_role", nullable = false) private String recipientRole;
  @Column(name = "recipient_id", nullable = false) private String recipientId;
  /** message | booking | order | phase | stage | change_request | otp_sent */
  @Column(nullable = false) private String kind;
  @Column(name = "order_id") private String orderId;
  @Column(nullable = false) private String title;
  @Column(nullable = false) private String body;
  @Column(name = "read_at") private OffsetDateTime readAt;
  @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;
}

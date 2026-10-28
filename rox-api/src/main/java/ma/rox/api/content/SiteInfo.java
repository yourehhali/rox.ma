package ma.rox.api.content;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "site_info")
@Getter @Setter @NoArgsConstructor
public class SiteInfo {
  @Id private Integer id;
  @Column(nullable = false) private String email;
  @Column(nullable = false) private String phone;
  @Column(nullable = false) private String whatsapp;
  @Column(name = "pricing_note", nullable = false, columnDefinition = "text") private String pricingNote;

  // Floating WhatsApp bubble: visibility, pre-filled opening message and the
  // corner it docks to ("left" | "right"). Disabled by default so the bubble
  // only appears once the admin opts in.
  @Column(name = "whatsapp_enabled", nullable = false) private boolean whatsappEnabled;
  @Column(name = "whatsapp_message", nullable = false, columnDefinition = "text") private String whatsappMessage = "";
  @Column(name = "whatsapp_position", nullable = false) private String whatsappPosition = "right";

  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "cities", columnDefinition = "text[]")
  private List<String> cities = new ArrayList<>();
}

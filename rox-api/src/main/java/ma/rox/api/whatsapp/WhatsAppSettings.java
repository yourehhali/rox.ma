package ma.rox.api.whatsapp;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Single-row configuration for the OpenWA WhatsApp OTP gateway, edited from the
 * admin panel. Blank string columns fall back to env-derived defaults (see
 * {@link WhatsAppSettingsService}); {@code sessionId} is populated once the
 * WhatsApp session is created/paired. The API key is stored here but masked on
 * read and never logged.
 */
@Entity
@Table(name = "whatsapp_settings")
@Getter @Setter @NoArgsConstructor
public class WhatsAppSettings {
  @Id @Column(name = "id") private String id;
  @Column(name = "enabled", nullable = false) private boolean enabled = false;
  @Column(name = "base_url") private String baseUrl;
  @Column(name = "api_key") private String apiKey;
  @Column(name = "session_name") private String sessionName;
  @Column(name = "session_id") private String sessionId;
  @Column(name = "message_template") private String messageTemplate;
  @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;
}

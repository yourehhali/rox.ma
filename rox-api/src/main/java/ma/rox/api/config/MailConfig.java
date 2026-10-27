package ma.rox.api.config;

import java.util.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * Explicit {@link JavaMailSender} so we control how the SMTP settings are applied.
 *
 * <p>Overrides Spring Boot's auto-configured sender (which is
 * {@code @ConditionalOnMissingBean}). Two reasons:
 * <ol>
 *   <li>Env values pasted into Dokploy keep any space after {@code KEY= }, so
 *       {@code SMTP_HOST= smtp…} binds to a host literally named " smtp…" and
 *       the connect silently fails. We {@code trim()} every string here so a
 *       stray space can never break delivery.</li>
 *   <li>Brevo's 587 relay requires STARTTLS; we assert {@code starttls.required}
 *       rather than just {@code enable}.</li>
 * </ol>
 * When {@code SMTP_HOST} is blank the sender is still built (bean creation must
 * not fail) but {@link ma.rox.api.auth.EmailService} skips sending.
 */
@Configuration
public class MailConfig {

  private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

  @Bean
  JavaMailSender javaMailSender(
      @Value("${spring.mail.host:}") String host,
      @Value("${spring.mail.port:587}") int port,
      @Value("${spring.mail.username:}") String username,
      @Value("${spring.mail.password:}") String password,
      @Value("${rox.mail.from:ROX Agency <no-reply@rox.ma>}") String from) {
    String cleanHost = trimToNull(host);

    JavaMailSenderImpl sender = new JavaMailSenderImpl();
    sender.setHost(cleanHost);
    sender.setPort(port);
    sender.setUsername(trimToNull(username));
    sender.setPassword(trimToNull(password));
    sender.setDefaultEncoding("UTF-8");

    Properties props = sender.getJavaMailProperties();
    props.put("mail.transport.protocol", "smtp");
    props.put("mail.smtp.auth", String.valueOf(username != null && !username.isBlank()));
    props.put("mail.smtp.starttls.enable", "true");
    props.put("mail.smtp.starttls.required", "true");
    props.put("mail.smtp.connectiontimeout", "5000");
    props.put("mail.smtp.timeout", "5000");
    props.put("mail.smtp.writetimeout", "5000");

    if (cleanHost == null) {
      log.warn("SMTP disabled (SMTP_HOST blank) — OTP/transactional emails will be skipped.");
    } else {
      log.info("SMTP configured → host={} port={} user={} from={}",
          cleanHost, port, trimToNull(username), trimToNull(from));
    }
    return sender;
  }

  private static String trimToNull(String v) {
    if (v == null) return null;
    String t = v.trim();
    return t.isEmpty() ? null : t;
  }
}

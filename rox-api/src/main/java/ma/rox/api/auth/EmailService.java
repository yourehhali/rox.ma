package ma.rox.api.auth;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Thin best-effort wrapper around {@link JavaMailSender}. Sends are async so
 * signup + reset flows never fail on SMTP hiccups; the admin panel exposes a
 * "resend" action for stuck users. When SMTP is not configured (`SMTP_HOST`
 * empty) we log-and-skip so the app still boots in dev without a mail server.
 */
@Service
public class EmailService {

  private static final Logger log = LoggerFactory.getLogger(EmailService.class);

  private final JavaMailSender sender;
  private final String from;
  private final boolean enabled;

  public EmailService(
      JavaMailSender sender,
      @Value("${spring.mail.host:}") String host,
      @Value("${rox.mail.from:ROX Agency <no-reply@rox.ma>}") String from) {
    this.sender = sender;
    this.from = from;
    this.enabled = host != null && !host.isBlank();
  }

  @Async
  public void send(String to, String subject, String text, String html) {
    if (!enabled) {
      log.warn("SMTP disabled — skipping email to {} ({})", to, subject);
      return;
    }
    try {
      MimeMessage msg = sender.createMimeMessage();
      MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
      h.setFrom(from);
      h.setTo(to);
      h.setSubject(subject);
      h.setText(text == null ? stripTags(html) : text);
      if (html != null) h.setText(html, true);
      sender.send(msg);
      log.info("Email sent to {} ({})", to, subject);
    } catch (Exception ex) {
      log.error("Email send failed to {} ({}): {}", to, subject, ex.getMessage());
    }
  }

  public boolean isEnabled() { return enabled; }

  private static String stripTags(String s) {
    return s == null ? "" : s.replaceAll("<[^>]+>", "");
  }
}

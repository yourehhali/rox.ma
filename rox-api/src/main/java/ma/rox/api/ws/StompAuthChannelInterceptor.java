package ma.rox.api.ws;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import ma.rox.api.security.JwtService;
import ma.rox.api.security.RoxPrincipal;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

/**
 * Reads the JWT from the STOMP CONNECT frame and populates the session
 * Principal. Anonymous connections are rejected so `/user/queue/...`
 * destinations cannot be forged.
 *
 * Accepted credential formats:
 *   1. `Authorization: Bearer <jwt>`            (recommended)
 *   2. `login: <jwt>` + `passcode: <empty>`     (SockJS fallback)
 *   3. HTTP Basic — base64 of "<jwt>:"
 *
 * The resulting Principal's name is `ROLE:<id>` (matches NotificationService.principalName).
 */
@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

  private final JwtService jwt;

  public StompAuthChannelInterceptor(JwtService jwt) { this.jwt = jwt; }

  @Override
  public Message<?> preSend(Message<?> message, MessageChannel channel) {
    StompHeaderAccessor acc = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
    if (acc == null) return message;
    if (!StompCommand.CONNECT.equals(acc.getCommand())) return message;

    String token = extractToken(acc);
    if (token == null) {
      throw new SecurityException("Missing JWT in STOMP CONNECT frame");
    }
    JwtService.DecodedToken d;
    try {
      d = jwt.parse(token, JwtService.TYPE_ACCESS);
    } catch (RuntimeException ex) {
      throw new SecurityException("Invalid access token", ex);
    }
    RoxPrincipal p = d.principal();
    String name = ma.rox.api.notification.NotificationService.principalName(p);
    acc.setUser(new StompPrincipal(p, name));
    return message;
  }

  private static String extractToken(StompHeaderAccessor acc) {
    String a = acc.getFirstNativeHeader("Authorization");
    if (a != null && a.startsWith("Bearer ")) return a.substring(7).trim();
    String login = acc.getLogin();
    if (login != null && !login.isBlank()) return login.trim();
    if (a != null && a.startsWith("Basic ")) {
      String raw = new String(Base64.getDecoder().decode(a.substring(6).trim()), StandardCharsets.UTF_8);
      int colon = raw.indexOf(':');
      return colon >= 0 ? raw.substring(0, colon) : raw;
    }
    return null;
  }

}

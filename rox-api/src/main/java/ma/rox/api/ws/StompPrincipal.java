package ma.rox.api.ws;

import java.security.Principal;
import ma.rox.api.security.RoxPrincipal;

/**
 * Session-level {@link Principal} set by {@link StompAuthChannelInterceptor} on
 * the STOMP CONNECT frame. The `name` (`ROLE:<id>`) is what Spring uses to route
 * `/user/queue/**` destinations; the wrapped {@link RoxPrincipal} carries the
 * decoded claims for downstream handlers (see {@code ChatSocketController}).
 */
public record StompPrincipal(RoxPrincipal rox, String name) implements Principal {
  @Override public String getName() { return name; }
}

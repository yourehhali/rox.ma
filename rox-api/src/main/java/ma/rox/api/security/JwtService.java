package ma.rox.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import ma.rox.api.error.ApiException;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  public static final String CLAIM_ROLE = "role";
  public static final String CLAIM_ID = "uid";
  public static final String CLAIM_TYPE = "typ";
  public static final String TYPE_ACCESS = "access";
  public static final String TYPE_REFRESH = "refresh";

  private final JwtProperties props;
  private final SecretKey key;

  public JwtService(JwtProperties props) {
    this.props = props;
    byte[] raw = props.secret().getBytes(StandardCharsets.UTF_8);
    if (raw.length < 32) {
      throw new IllegalStateException("rox.jwt.secret must be at least 32 bytes long.");
    }
    this.key = Keys.hmacShaKeyFor(raw);
  }

  public String issue(RoxPrincipal principal, String jti, String type, Duration ttl) {
    Instant now = Instant.now();
    return Jwts.builder()
        .id(jti)
        .subject(principal.email())
        .issuer(props.issuer())
        .claim(CLAIM_ROLE, principal.role().name())
        .claim(CLAIM_ID, principal.id())
        .claim(CLAIM_TYPE, type)
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(ttl)))
        .signWith(key)
        .compact();
  }

  public String issueAccess(RoxPrincipal principal, String jti) {
    return issue(principal, jti, TYPE_ACCESS, Duration.ofMinutes(props.accessTtlMinutes()));
  }

  public String issueRefresh(RoxPrincipal principal, String jti) {
    return issue(principal, jti, TYPE_REFRESH, Duration.ofDays(props.refreshTtlDays()));
  }

  public DecodedToken parse(String token, String expectedType) {
    try {
      Claims c = Jwts.parser()
          .verifyWith(key)
          .requireIssuer(props.issuer())
          .build()
          .parseSignedClaims(token)
          .getPayload();
      String typ = c.get(CLAIM_TYPE, String.class);
      if (expectedType != null && !expectedType.equals(typ)) {
        throw ApiException.unauthorized("Type de token invalide.");
      }
      RoxPrincipal principal = new RoxPrincipal(
          c.get(CLAIM_ID, String.class),
          c.getSubject(),
          Role.valueOf(c.get(CLAIM_ROLE, String.class)));
      return new DecodedToken(c.getId(), principal, typ);
    } catch (JwtException | IllegalArgumentException ex) {
      throw ApiException.unauthorized("Jeton invalide ou expiré.");
    }
  }

  public Duration accessTtl() { return Duration.ofMinutes(props.accessTtlMinutes()); }
  public Duration refreshTtl() { return Duration.ofDays(props.refreshTtlDays()); }

  public record DecodedToken(String jti, RoxPrincipal principal, String type) {}
}

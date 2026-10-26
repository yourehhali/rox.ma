package ma.rox.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwt;

  public JwtAuthFilter(JwtService jwt) { this.jwt = jwt; }

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String header = req.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7).trim();
      if (!token.isEmpty() && SecurityContextHolder.getContext().getAuthentication() == null) {
        try {
          JwtService.DecodedToken d = jwt.parse(token, JwtService.TYPE_ACCESS);
          var auth = new UsernamePasswordAuthenticationToken(
              d.principal(),
              token,
              List.of(new SimpleGrantedAuthority("ROLE_" + d.principal().role().name())));
          SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (RuntimeException ignore) {
          SecurityContextHolder.clearContext();
        }
      }
    }
    chain.doFilter(req, res);
  }
}

package ma.rox.api.security;

import ma.rox.api.error.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

  public RoxPrincipal require() {
    Authentication a = SecurityContextHolder.getContext().getAuthentication();
    if (a == null || !(a.getPrincipal() instanceof RoxPrincipal p)) {
      throw ApiException.unauthorized("Session requise.");
    }
    return p;
  }

  public RoxPrincipal require(Role role) {
    RoxPrincipal p = require();
    if (p.role() != role) throw ApiException.forbidden();
    return p;
  }

  public RoxPrincipal requireClient() { return require(Role.CLIENT); }
  public RoxPrincipal requireAdmin()  { return require(Role.ADMIN); }
}

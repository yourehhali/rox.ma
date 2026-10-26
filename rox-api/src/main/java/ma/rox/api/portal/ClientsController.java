package ma.rox.api.portal;

import java.util.List;
import ma.rox.api.auth.AuthDtos.ClientUserDto;
import ma.rox.api.auth.AuthService;
import ma.rox.api.auth.ClientAccount;
import ma.rox.api.portal.PortalDtos.PortalDataDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/clients")
public class ClientsController {

  private final PortalService svc;

  public ClientsController(PortalService svc) { this.svc = svc; }

  @GetMapping
  public List<ClientUserDto> list() {
    return svc.listClients().stream().map(AuthService::toClientDto).toList();
  }

  @GetMapping("/{id}/portal")
  public PortalDataDto portalOf(@PathVariable String id) {
    ClientAccount c = svc.requireClient(id);
    return svc.buildPortal(c);
  }
}

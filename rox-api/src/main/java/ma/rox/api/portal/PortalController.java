package ma.rox.api.portal;

import ma.rox.api.security.CurrentUser;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/portal")
public class PortalController {

  private final PortalService svc;
  private final CurrentUser me;

  public PortalController(PortalService svc, CurrentUser me) {
    this.svc = svc;
    this.me = me;
  }

  @GetMapping
  public ResponseEntity<PortalDtos.PortalDataDto> portal() {
    var client = svc.requireClient(me.requireClient().id());
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .body(svc.buildPortal(client));
  }
}

package ma.rox.api.content;

import jakarta.validation.Valid;
import ma.rox.api.content.ContentDtos.SiteContentDto;
import ma.rox.api.content.ContentDtos.SiteInfoDto;
import ma.rox.api.security.CurrentUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/content")
public class InfoController {

  private final ContentService svc;
  private final CurrentUser me;

  public InfoController(ContentService svc, CurrentUser me) {
    this.svc = svc;
    this.me = me;
  }

  @GetMapping("/info")
  public SiteInfoDto get() { return svc.getInfo(); }

  @PutMapping("/info")
  public SiteInfoDto put(@Valid @RequestBody SiteInfoDto in) {
    me.requireAdmin();
    return svc.putInfo(in);
  }

  /** Full aggregate — public, cacheable. */
  @GetMapping
  public SiteContentDto aggregate(@RequestParam(name = "all", required = false, defaultValue = "false") boolean all) {
    if (all) me.requireAdmin();
    return svc.aggregate(!all);
  }
}

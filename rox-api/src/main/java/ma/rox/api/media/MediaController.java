package ma.rox.api.media;

import java.util.Map;
import ma.rox.api.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Admin-only image upload used by the portfolio (and future) editors. Returns the
 * public path; the client then sets it on the entity and saves it via the normal
 * CRUD endpoints — this endpoint never writes to the DB by itself.
 */
@RestController
@RequestMapping("/portfolio/media")
public class MediaController {

  private final MediaService media;
  private final CurrentUser me;

  public MediaController(MediaService media, CurrentUser me) {
    this.media = media;
    this.me = me;
  }

  @PostMapping
  public Map<String, String> upload(
      @RequestParam("file") MultipartFile file,
      @RequestParam(name = "subdir", required = false, defaultValue = "portfolio") String subdir) {
    me.requireAdmin();
    return Map.of("url", media.store(file, subdir));
  }
}

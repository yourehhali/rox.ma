package ma.rox.api.content;

import java.util.List;
import java.util.Map;
import ma.rox.api.content.ContentDtos.FaqItemDto;
import ma.rox.api.security.CurrentUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/content/faqs")
public class FaqsController {

  private final ContentService svc;
  private final CurrentUser me;

  public FaqsController(ContentService svc, CurrentUser me) {
    this.svc = svc;
    this.me = me;
  }

  @GetMapping
  public Map<String, List<FaqItemDto>> all() { return svc.allFaqs(); }

  @GetMapping("/{group}")
  public List<FaqItemDto> one(@PathVariable String group) { return svc.oneFaq(group); }

  @PutMapping("/{group}")
  public List<FaqItemDto> replace(@PathVariable String group, @RequestBody List<FaqItemDto> items) {
    me.requireAdmin();
    return svc.replaceFaq(group, items);
  }
}

package ma.rox.api.portfolio;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import ma.rox.api.ai.PortfolioAiDtos.AiDraftRequest;
import ma.rox.api.ai.PortfolioAiDtos.PortfolioDraftDto;
import ma.rox.api.ai.PortfolioAiService;
import ma.rox.api.error.ApiException;
import ma.rox.api.portfolio.PortfolioDtos.PortfolioItemDto;
import ma.rox.api.portfolio.PortfolioDtos.PortfolioItemInput;
import ma.rox.api.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/portfolio")
public class PortfolioController {

  private final PortfolioService svc;
  private final CurrentUser me;
  private final PortfolioAiService ai;

  public PortfolioController(PortfolioService svc, CurrentUser me, PortfolioAiService ai) {
    this.svc = svc;
    this.me = me;
    this.ai = ai;
  }

  /** ?all=true (admin) returns drafts too. */
  @GetMapping
  public List<PortfolioItemDto> list(@RequestParam(name = "all", required = false, defaultValue = "false") boolean all) {
    if (all) me.requireAdmin();
    return svc.list(!all);
  }

  @GetMapping("/{id}")
  public PortfolioItemDto one(@PathVariable String id) { return svc.one(id); }

  /**
   * AI draft helper: fills the admin form from a short brief via Gemini. Returns a
   * draft only — nothing is persisted; the admin reviews the fields and an explicit
   * save (POST/PATCH) writes them.
   */
  @PostMapping("/ai-draft")
  public PortfolioDraftDto aiDraft(@RequestBody AiDraftRequest req) {
    me.requireAdmin();
    return ai.draft(req);
  }

  @PostMapping
  public ResponseEntity<PortfolioItemDto> create(@Valid @RequestBody PortfolioItemInput in) {
    me.requireAdmin();
    return ResponseEntity.status(HttpStatus.CREATED).body(svc.create(in));
  }

  @PatchMapping("/{id}")
  public PortfolioItemDto patch(@PathVariable String id, @RequestBody PortfolioItemInput in) {
    me.requireAdmin();
    return svc.update(id, in);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id) {
    me.requireAdmin();
    svc.delete(id);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{id}/published")
  public PortfolioItemDto setPublished(@PathVariable String id, @RequestBody Map<String, Object> body) {
    me.requireAdmin();
    Object v = body.get("published");
    if (v == null) throw ApiException.badRequest("Champ 'published' requis.",
        List.of(new ma.rox.api.error.ApiError.FieldIssue("published", "required")));
    return svc.setPublished(id, Boolean.parseBoolean(String.valueOf(v)));
  }

  @PatchMapping("/{id}/featured")
  public PortfolioItemDto setFeatured(@PathVariable String id, @RequestBody Map<String, Object> body) {
    me.requireAdmin();
    Object v = body.get("featured");
    if (v == null) throw ApiException.badRequest("Champ 'featured' requis.",
        List.of(new ma.rox.api.error.ApiError.FieldIssue("featured", "required")));
    return svc.setFeatured(id, Boolean.parseBoolean(String.valueOf(v)));
  }
}

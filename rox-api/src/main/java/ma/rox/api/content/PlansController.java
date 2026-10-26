package ma.rox.api.content;

import jakarta.validation.Valid;
import java.util.List;
import ma.rox.api.content.ContentDtos.PlanDto;
import ma.rox.api.content.ContentDtos.PlanInput;
import ma.rox.api.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/content/plans")
public class PlansController {

  private final ContentService svc;
  private final CurrentUser me;

  public PlansController(ContentService svc, CurrentUser me) {
    this.svc = svc;
    this.me = me;
  }

  @GetMapping
  public List<PlanDto> list() { return svc.listPlans(); }

  @GetMapping("/{id}")
  public PlanDto one(@PathVariable String id) { return svc.getPlan(id); }

  @PostMapping
  public ResponseEntity<PlanDto> create(@Valid @RequestBody PlanInput in) {
    me.requireAdmin();
    return ResponseEntity.status(HttpStatus.CREATED).body(svc.createPlan(in));
  }

  @PatchMapping("/{id}")
  public PlanDto patch(@PathVariable String id, @RequestBody PlanInput in) {
    me.requireAdmin();
    return svc.updatePlan(id, in);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id) {
    me.requireAdmin();
    svc.deletePlan(id);
    return ResponseEntity.noContent().build();
  }
}

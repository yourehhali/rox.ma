package ma.rox.api.content;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import ma.rox.api.content.ContentDtos.ServiceDto;
import ma.rox.api.content.ContentDtos.ServiceInput;
import ma.rox.api.error.ApiException;
import ma.rox.api.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/content/services")
public class ServicesController {

  private final ContentService svc;
  private final CurrentUser me;

  public ServicesController(ContentService svc, CurrentUser me) {
    this.svc = svc;
    this.me = me;
  }

  @GetMapping
  public List<ServiceDto> list(@RequestParam(name = "all", required = false, defaultValue = "false") boolean all) {
    if (all) me.requireAdmin();
    return svc.listServices(!all);
  }

  @GetMapping("/slug/{slug}")
  public ServiceDto bySlug(@PathVariable String slug) { return svc.getServiceBySlug(slug); }

  @GetMapping("/{id}")
  public ServiceDto one(@PathVariable String id) { return svc.getService(id); }

  @PostMapping
  public ResponseEntity<ServiceDto> create(@Valid @RequestBody ServiceInput in) {
    me.requireAdmin();
    return ResponseEntity.status(HttpStatus.CREATED).body(svc.createService(in));
  }

  @PatchMapping("/{id}")
  public ServiceDto patch(@PathVariable String id, @RequestBody ServiceInput in) {
    me.requireAdmin();
    return svc.updateService(id, in);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id) {
    me.requireAdmin();
    svc.deleteService(id);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{id}/published")
  public ServiceDto setPublished(@PathVariable String id, @RequestBody Map<String, Object> body) {
    me.requireAdmin();
    Object v = body.get("published");
    if (v == null) throw ApiException.badRequest("Champ 'published' requis.",
        List.of(new ma.rox.api.error.ApiError.FieldIssue("published", "required")));
    return svc.setServicePublished(id, Boolean.parseBoolean(String.valueOf(v)));
  }
}

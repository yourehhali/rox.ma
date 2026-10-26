package ma.rox.api.analytics;

import java.util.List;
import ma.rox.api.analytics.AnalyticsDtos.TrafficPointDto;
import ma.rox.api.portal.PortalService;
import ma.rox.api.portal.PortalDtos.AdminStatsDto;
import ma.rox.api.security.CurrentUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
public class AnalyticsController {

  private final TrafficRepo traffic;
  private final PortalService portal;
  private final CurrentUser me;

  public AnalyticsController(TrafficRepo traffic, PortalService portal, CurrentUser me) {
    this.traffic = traffic;
    this.portal = portal;
    this.me = me;
  }

  @GetMapping("/stats")
  public AdminStatsDto stats() {
    me.requireAdmin();
    return portal.adminStats();
  }

  @GetMapping("/traffic")
  public List<TrafficPointDto> traffic(@RequestParam(name = "range", required = false, defaultValue = "12M") String range) {
    me.requireAdmin();
    List<TrafficPoint> all = traffic.findAllByOrderByYearAscMonthAsc();
    int limit = switch (range) {
      case "6M" -> 6;
      case "YTD" -> {
        int thisYear = java.time.Year.now().getValue();
        yield (int) all.stream().filter(t -> t.getYear() == thisYear).count();
      }
      default -> 12;
    };
    if (range.equals("YTD")) {
      int thisYear = java.time.Year.now().getValue();
      return all.stream().filter(t -> t.getYear() == thisYear).map(t -> new TrafficPointDto(t.getMonth(), t.getViews(), t.getContacts())).toList();
    }
    int from = Math.max(0, all.size() - limit);
    return all.subList(from, all.size()).stream()
        .map(t -> new TrafficPointDto(t.getMonth(), t.getViews(), t.getContacts())).toList();
  }
}

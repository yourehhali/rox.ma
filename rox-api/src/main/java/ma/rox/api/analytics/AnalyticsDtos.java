package ma.rox.api.analytics;

public final class AnalyticsDtos {
  private AnalyticsDtos() {}
  public record TrafficPointDto(String month, int views, int contacts) {}
}

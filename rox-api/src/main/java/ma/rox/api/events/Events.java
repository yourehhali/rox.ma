package ma.rox.api.events;

/**
 * Domain events fired by PortalService and consumed by NotificationListener for
 * cross-cutting reactions (persist notification rows + WS broadcasts). Kept as
 * records so publishing is cheap and immutable.
 */
public final class Events {
  private Events() {}

  public record OrderCreated(String orderId, String clientId, String title, String service) {}
  public record PhaseAdvanced(String orderId, String clientId, String phase) {}
  public record StatusChanged(String orderId, String clientId, String status) {}
  public record MessagePosted(String messageId, String orderId, String clientId,
                               String sender, String textPreview) {}
  public record BookingRequested(String bookingId, String clientId, String date, String time) {}
  public record BookingConfirmed(String bookingId, String clientId, String date, String time) {}
  public record ChangeRequestSubmitted(String requestId, String orderId, String clientId,
                                        String type) {}
  public record ChangeRequestHandled(String requestId, String orderId, String clientId) {}
  public record StageChanged(String orderId, String clientId, String fromStage, String toStage,
                              String actorId) {}
}

package ma.rox.api.portal;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import ma.rox.api.auth.AuthDtos.ClientUserDto;

/** Request/response records for the Portal domain. Field names match api-spec.json schemas verbatim. */
public final class PortalDtos {
  private PortalDtos() {}

  public record TaskDto(String id, String label, boolean done, String updatedAt) {}

  public record OrderEventDto(String id, String at, String note) {}

  /** type: update|edit · status: ouvert|pris en compte */
  public record ChangeRequestDto(String id, String type, String note, String at, String status) {}

  public record ServiceHistoryItemDto(String id, String service, String year, String outcome) {}

  /** phase: cadrage|maquette|developpement|lancement · status: active|Terminé */
  public record OrderDto(
      String id, String title, String service, String description, String budget, String deadline,
      String phase, String status, String createdAt,
      List<TaskDto> tasks,
      List<OrderEventDto> events,
      List<ChangeRequestDto> requests,
      List<ServiceHistoryItemDto> history) {}

  /** Flattened order + owning client (used by admin order list). */
  public record ClientRefDto(String id, String name, String email) {}
  public record AdminOrderDto(OrderDto order, ClientRefDto client) {}

  /** sender/`from` is client|rep */
  public record MessageDto(String id, String clientId, String orderId, String at, String from, String text) {}

  /** date yyyy-MM-dd · time HH:mm · status demandé|confirmé */
  public record CallBookingDto(String id, String clientId, String date, String time, String subject, String status) {}
  public record AdminBookingDto(CallBookingDto booking, ClientRefDto client) {}

  public record PortalDataDto(ClientUserDto user, List<OrderDto> orders, List<MessageDto> messages, List<CallBookingDto> bookings) {}

  public record ServiceHistoryInput(
      String id,
      @NotBlank String service,
      @NotBlank String year,
      @NotBlank String outcome) {}

  public record NewOrderInput(
      @NotBlank @jakarta.validation.constraints.Size(max = 140) String title,
      @NotBlank String service,
      @NotBlank @jakarta.validation.constraints.Size(max = 4000) String description,
      @NotBlank String budget,
      @NotBlank String deadline,
      @jakarta.validation.constraints.NotNull List<ServiceHistoryInput> pastServices) {}

  public record SendMessageRequest(@NotBlank String text, String orderId) {}

  public record BookCallRequest(@NotBlank String date, @NotBlank String time, String subject) {}

  public record AdminStatsDto(long clients, long active, long completed, long openRequests) {}
}

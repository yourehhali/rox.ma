package ma.rox.api.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request/response records for the Auth domain — see api-spec.json schemas ClientUser, AdminUser, AuthSession. */
public final class AuthDtos {
  private AuthDtos() {}

  public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

  public record ClientSignupRequest(
      @NotBlank @Size(min = 2, max = 80) String name,
      @NotBlank @Email String email,
      @NotBlank @Size(min = 8, max = 200) String password) {}

  public record ClientUserDto(String id, String name, String email, String createdAt) {}

  public record AdminUserDto(String id, String email, String name, String createdAt) {}

  @JsonInclude(JsonInclude.Include.NON_NULL)
  public record AuthSessionDto(
      String accessToken,
      String refreshToken,
      /** Access-token TTL in seconds. */
      long accessExpiresIn,
      ClientUserDto user) {}

  @JsonInclude(JsonInclude.Include.NON_NULL)
  public record AdminAuthSessionDto(
      String accessToken,
      String refreshToken,
      long accessExpiresIn,
      AdminUserDto user) {}

  /** Generic refresh payload. */
  public record RefreshRequest(@NotBlank String refreshToken) {}
}

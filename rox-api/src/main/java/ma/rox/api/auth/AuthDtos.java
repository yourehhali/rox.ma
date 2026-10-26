package ma.rox.api.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request/response records for the Auth domain — see api-spec.json schemas ClientUser, AdminUser, AuthSession. */
public final class AuthDtos {
  private AuthDtos() {}

  public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

  /**
   * Password policy: min 8 chars, at least one lowercase, one uppercase, one digit.
   * Phone: optional leading +, 8-15 digits total (E.164-ish).
   */
  public record ClientSignupRequest(
      @NotBlank @Size(min = 2, max = 80) String name,
      @NotBlank @Email String email,
      @NotBlank
      @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "Format de téléphone invalide")
      String phone,
      @NotBlank
      @Pattern(
          regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,200}$",
          message = "Le mot de passe doit contenir au moins 8 caractères avec une majuscule, une minuscule et un chiffre")
      String password) {}

  /** Update payload — every field optional; blank/null fields are ignored by the service. */
  public record ClientUpdateRequest(
      @Size(min = 2, max = 80) String name,
      @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "Format de téléphone invalide") String phone) {}

  @JsonInclude(JsonInclude.Include.NON_NULL)
  public record ClientUserDto(
      String id, String name, String email, String phone,
      Boolean verified, String createdAt) {}

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

  /** Verify / resend OTP payloads (Phase 3). */
  public record VerifyOtpRequest(
      @NotBlank @Email String email,
      @NotBlank @Pattern(regexp = "^[0-9]{6}$", message = "Code invalide") String code) {}

  public record ResendOtpRequest(@NotBlank @Email String email) {}
}

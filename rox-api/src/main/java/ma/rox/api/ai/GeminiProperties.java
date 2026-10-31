package ma.rox.api.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bound from {@code rox.gemini.*}. Google Gemini (free tier) credentials for the
 * portfolio "Remplir avec l'IA" helper. Auto-discovered via
 * {@code @ConfigurationPropertiesScan}. An empty {@code apiKey} means the feature is
 * disabled — callers get a clear error instead of an outbound call.
 */
@ConfigurationProperties(prefix = "rox.gemini")
public record GeminiProperties(String apiKey, String model, String baseUrl) {
  public GeminiProperties {
    if (model == null || model.isBlank()) model = "gemini-2.0-flash";
    if (baseUrl == null || baseUrl.isBlank()) {
      baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    }
  }

  public boolean enabled() { return apiKey != null && !apiKey.isBlank(); }
}

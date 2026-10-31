package ma.rox.api.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bound from {@code rox.gemini.*}. Google Gemini (free tier) credentials for the
 * portfolio "Remplir avec l'IA" helper. Auto-discovered via
 * {@code @ConfigurationPropertiesScan}. An empty {@code apiKey} means the feature is
 * disabled — callers get a clear error instead of an outbound call.
 *
 * <p>{@code dailyLimit} and {@code maxOutputTokens} keep us inside the free tier:
 * Google caps free projects on RPM, input TPM and RPD (reset at midnight Pacific),
 * so we self-impose a small daily budget and short outputs instead of burning the
 * quota on long generations.
 */
@ConfigurationProperties(prefix = "rox.gemini")
public record GeminiProperties(
    String apiKey, String model, String baseUrl, Integer dailyLimit, Integer maxOutputTokens,
    Boolean orderPromptEnabled, Integer orderMaxOutputTokens) {
  public GeminiProperties {
    if (model == null || model.isBlank()) model = "gemini-2.0-flash";
    if (baseUrl == null || baseUrl.isBlank()) {
      baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    }
    if (dailyLimit == null || dailyLimit <= 0) dailyLimit = 50;
    if (maxOutputTokens == null || maxOutputTokens <= 0) maxOutputTokens = 700;
    if (orderPromptEnabled == null) orderPromptEnabled = true;
    // Order triage returns a long English UI prompt — a tight cap would truncate
    // the JSON and make the answer unparseable, so it gets its own larger budget.
    if (orderMaxOutputTokens == null || orderMaxOutputTokens <= 0) orderMaxOutputTokens = 1100;
  }

  public boolean enabled() { return apiKey != null && !apiKey.isBlank(); }
  // Order-brief AI triage feature flag: the record accessor orderPromptEnabled()
  // is never null after the compact constructor (runs on any available provider).
}

package ma.rox.api.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bound from {@code rox.cloudflare-ai.*}. Cloudflare Workers AI (free tier) —
 * the bulk/overflow text provider. Free allocation is 10,000 Neurons/day per
 * account (no card required, resets 00:00 UTC), which comfortably covers
 * thousands of short generations; {@code dailyLimit} is our own safety budget.
 * Empty {@code accountId} or {@code apiToken} disables the provider — the
 * {@link LlmRouter} then simply routes to Gemini.
 */
@ConfigurationProperties(prefix = "rox.cloudflare-ai")
public record CloudflareProperties(
    String accountId, String apiToken, String model, String baseUrl, Integer dailyLimit) {
  public CloudflareProperties {
    if (model == null || model.isBlank()) model = "@cf/meta/llama-3.1-8b-instruct";
    if (baseUrl == null || baseUrl.isBlank()) baseUrl = "https://api.cloudflare.com/client/v4";
    if (dailyLimit == null || dailyLimit < 0) dailyLimit = 100;
  }

  public boolean enabled() {
    return accountId != null && !accountId.isBlank()
        && apiToken != null && !apiToken.isBlank();
  }
}

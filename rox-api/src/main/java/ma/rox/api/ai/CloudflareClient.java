package ma.rox.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Minimal, stateless wrapper around the Cloudflare Workers AI {@code /ai/run}
 * REST API (free tier). Like {@link GeminiClient} it holds no config itself —
 * the caller passes account/token/model so this bean is trivially mockable.
 * Responses are read as raw text and parsed locally so an unexpected
 * content-type never breaks extraction. HTTP errors surface as
 * {@link RestClientResponseException} (429 = neuron budget exhausted) for
 * {@link LlmRouter} to map.
 */
@Component
public class CloudflareClient {

  private final RestClient http;
  private final ObjectMapper mapper = new ObjectMapper();

  public CloudflareClient() {
    SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
    f.setConnectTimeout(5000);
    f.setReadTimeout(30000); // serverless GPU cold starts can be slow
    this.http = RestClient.builder().requestFactory(f).build();
  }

  /** Chat completion; {@code maxTokens} caps the reply when positive. */
  public String generate(
      String baseUrl, String accountId, String apiToken, String model, String prompt, int maxTokens) {
    Map<String, Object> body = new HashMap<>();
    body.put("messages", List.of(Map.of("role", "user", "content", prompt)));
    body.put("temperature", 0.4);
    if (maxTokens > 0) body.put("max_tokens", maxTokens);

    String url = trimTrailing(baseUrl) + "/accounts/" + accountId + "/ai/run/" + model;
    String raw = http.post().uri(url)
        .header("authorization", "Bearer " + apiToken)
        .contentType(MediaType.APPLICATION_JSON)
        .accept(MediaType.APPLICATION_JSON)
        .body(body)
        .retrieve().body(String.class);

    return extractText(raw);
  }

  /** Workers AI returns {success, result:{response,...}}; errors carry success=false. */
  private String extractText(String raw) {
    if (raw == null || raw.isBlank()) return "";
    JsonNode root;
    try {
      root = mapper.readTree(raw);
    } catch (Exception ex) {
      throw new IllegalStateException("Cloudflare AI a renvoy\u00e9 une r\u00e9ponse illisible.", ex);
    }
    if (root.path("success").isBoolean() && !root.path("success").asBoolean()) {
      JsonNode errs = root.path("errors");
      String msg = errs.isArray() && !errs.isEmpty()
          ? errs.get(0).path("message").asText("erreur Cloudflare AI")
          : "erreur Cloudflare AI";
      throw new IllegalStateException("Cloudflare AI: " + msg);
    }
    JsonNode result = root.path("result");
    String text = result.path("response").asText(null);
    if (text == null) text = result.path("output_text").asText(null);
    if (text == null && result.path("response").isArray()) {
      // Some models answer with an OpenAI-shaped choices/messages payload.
      JsonNode choices = result.path("choices");
      if (choices.isArray() && !choices.isEmpty()) {
        text = choices.get(0).path("message").path("content").asText(null);
      }
    }
    return text == null ? "" : text.strip();
  }

  private static String trimTrailing(String s) {
    String b = s == null ? "" : s.trim();
    return b.endsWith("/") ? b.substring(0, b.length() - 1) : b;
  }
}

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
 * Minimal, stateless wrapper around the Google Gemini {@code generateContent} REST
 * API (the same free tier used elsewhere). It holds no config itself — the caller
 * passes the key/model/base URL so this bean is trivially mockable, mirroring
 * {@link ma.rox.api.whatsapp.WhatsappClient} style. Responses are read as raw text
 * and parsed locally so an unexpected content-type never breaks extraction.
 */
@Component
public class GeminiClient {

  private final RestClient http;
  private final ObjectMapper mapper = new ObjectMapper();

  public GeminiClient() {
    SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
    f.setConnectTimeout(5000);
    f.setReadTimeout(20000); // generation can be slower than a normal API hop
    this.http = RestClient.builder().requestFactory(f).build();
  }

  /**
   * Ask Gemini for a plain text completion. When {@code jsonMode} is set the model is
   * instructed to return only valid JSON (used for structured drafts). When
   * {@code maxOutputTokens} is positive the reply is capped — on the free tier this
   * keeps each call small and predictable. Throws {@link IllegalStateException} on
   * transport/parse failure; callers map it.
   */
  public String generate(
      String baseUrl, String apiKey, String model, String prompt, boolean jsonMode,
      int maxOutputTokens) {
    Map<String, Object> gen = new HashMap<>();
    gen.put("temperature", 0.4);
    if (jsonMode) gen.put("responseMimeType", "application/json");
    if (maxOutputTokens > 0) gen.put("maxOutputTokens", maxOutputTokens);
    Map<String, Object> body = Map.of(
        "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
        "generationConfig", gen);

    String url = trimTrailing(baseUrl) + "/models/" + model + ":generateContent";
    String raw = http.post().uri(url)
        .header("x-goog-api-key", apiKey)
        .contentType(MediaType.APPLICATION_JSON)
        .accept(MediaType.APPLICATION_JSON)
        .body(body)
        .retrieve().body(String.class);

    return extractText(raw);
  }

  /** Concatenate every text part of the first candidate; empty string if none. */
  private String extractText(String raw) {
    if (raw == null || raw.isBlank()) return "";
    JsonNode root;
    try {
      root = mapper.readTree(raw);
    } catch (Exception ex) {
      throw new IllegalStateException("Gemini a renvoy\u00e9 une r\u00e9ponse illisible.", ex);
    }
    JsonNode err = root.path("error");
    if (!err.isMissingNode() && !err.isNull()) {
      String msg = err.path("message").asText("erreur Gemini");
      throw new IllegalStateException("Gemini: " + msg);
    }
    StringBuilder sb = new StringBuilder();
    for (JsonNode part : root.path("candidates").path(0).path("content").path("parts")) {
      String t = part.path("text").asText(null);
      if (t != null) sb.append(t);
    }
    return sb.toString().strip();
  }

  private static String trimTrailing(String s) {
    String b = s == null ? "" : s.trim();
    return b.endsWith("/") ? b.substring(0, b.length() - 1) : b;
  }
}

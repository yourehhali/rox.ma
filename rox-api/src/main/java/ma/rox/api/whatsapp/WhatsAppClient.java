package ma.rox.api.whatsapp;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Thin, stateless HTTP wrapper around an OpenWA gateway. Every method takes the
 * base URL + API key explicitly (never reads config itself) so this bean holds
 * no secrets and is trivially mockable. It maps only the handful of routes the
 * ROX OTP integration needs: health, session lifecycle, QR, and text send.
 *
 * <p>Non-2xx responses surface as {@link org.springframework.web.client.RestClientResponseException}
 * / {@link org.springframework.web.client.RestClientException}; callers decide
 * what to swallow.
 */
@Component
public class WhatsAppClient {

  public record SessionInfo(String id, String name, String status) {}
  public record QrResult(String qrCode, String status) {}

  private static final String API_KEY_HEADER = "X-API-Key";

  private final RestClient http;
  private final ObjectMapper mapper = new ObjectMapper();

  public WhatsAppClient() {
    SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
    f.setConnectTimeout(5000);
    f.setReadTimeout(10000);
    this.http = RestClient.builder().requestFactory(f).build();
  }

  /** GET /api/health — public, no key. True only on 2xx. */
  public boolean health(String baseUrl) {
    try {
      http.get().uri(url(baseUrl, "/api/health")).retrieve().toBodilessEntity();
      return true;
    } catch (RuntimeException ex) {
      return false;
    }
  }

  public List<SessionInfo> listSessions(String baseUrl, String apiKey) {
    JsonNode arr = asJson(get(baseUrl, apiKey, "/api/sessions"));
    List<SessionInfo> out = new ArrayList<>();
    if (arr != null && arr.isArray()) {
      for (JsonNode n : arr) out.add(toSession(n));
    }
    return out;
  }

  public SessionInfo createSession(String baseUrl, String apiKey, String name) {
    JsonNode n = asJson(http.post().uri(url(baseUrl, "/api/sessions"))
        .header(API_KEY_HEADER, apiKey)
        .accept(MediaType.APPLICATION_JSON)
        .contentType(MediaType.APPLICATION_JSON)
        .body(java.util.Map.of("name", name))
        .retrieve().body(String.class));
    return toSession(n);
  }

  public SessionInfo startSession(String baseUrl, String apiKey, String sessionId) {
    JsonNode n = asJson(postEmpty(baseUrl, apiKey, "/api/sessions/" + sessionId + "/start"));
    return toSession(n);
  }

  public QrResult getQr(String baseUrl, String apiKey, String sessionId) {
    JsonNode n = asJson(get(baseUrl, apiKey, "/api/sessions/" + sessionId + "/qr"));
    return new QrResult(
        n == null ? null : n.path("qrCode").asText(null),
        n == null ? null : n.path("status").asText(null));
  }

  /** Send a plain text message. Returns the accepted messageId, or null if OpenWA omitted it. */
  public String sendText(String baseUrl, String apiKey, String sessionId, String chatId, String text) {
    JsonNode n = asJson(http.post().uri(url(baseUrl, "/api/sessions/" + sessionId + "/messages/send-text"))
        .header(API_KEY_HEADER, apiKey)
        .accept(MediaType.APPLICATION_JSON)
        .contentType(MediaType.APPLICATION_JSON)
        .body(java.util.Map.of("chatId", chatId, "text", text))
        .retrieve().body(String.class));
    return n == null ? null : n.path("messageId").asText(null);
  }

  /** Resolve a session by unique name; empty if none matches. */
  public java.util.Optional<SessionInfo> findByName(String baseUrl, String apiKey, String name) {
    return listSessions(baseUrl, apiKey).stream()
        .filter(s -> name != null && name.equals(s.name()))
        .findFirst();
  }

  private String get(String baseUrl, String apiKey, String path) {
    return http.get().uri(url(baseUrl, path))
        .header(API_KEY_HEADER, apiKey)
        .accept(MediaType.APPLICATION_JSON)
        .retrieve().body(String.class);
  }

  private String postEmpty(String baseUrl, String apiKey, String path) {
    return http.post().uri(url(baseUrl, path))
        .header(API_KEY_HEADER, apiKey)
        .accept(MediaType.APPLICATION_JSON)
        .retrieve().body(String.class);
  }

  /**
   * OpenWA sometimes answers with {@code application/octet-stream} (or an empty body)
   * instead of {@code application/json}, which Spring's Jackson converter refuses to
   * extract into {@link JsonNode}. We read the raw text and parse it ourselves so the
   * response content-type never breaks the call.
   */
  private JsonNode asJson(String body) {
    if (body == null || body.isBlank()) return null;
    try {
      return mapper.readTree(body);
    } catch (JsonProcessingException ex) {
      String snippet = body.length() > 200 ? body.substring(0, 200) + "\u2026" : body;
      throw new IllegalStateException("OpenWA returned a non-JSON response: " + snippet, ex);
    }
  }

  private static SessionInfo toSession(JsonNode n) {
    if (n == null) return null;
    return new SessionInfo(n.path("id").asText(null), n.path("name").asText(null),
        n.path("status").asText(null));
  }

  /** Join base + path, trimming a trailing slash on the base. */
  private static String url(String baseUrl, String path) {
    String b = baseUrl == null ? "" : baseUrl.trim();
    if (b.endsWith("/")) b = b.substring(0, b.length() - 1);
    return b + path;
  }

}

package ma.rox.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import ma.rox.api.ai.PortfolioAiDtos.AiDraftRequest;
import ma.rox.api.ai.PortfolioAiDtos.PortfolioDraftDto;
import ma.rox.api.error.ApiException;
import ma.rox.api.error.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

/**
 * Turns a short brief into a draft portfolio item via Gemini. Purely stateless and
 * write-free: it returns a filled form for the admin to review; nothing touches the
 * DB here. The API key is server-side only (see {@link GeminiProperties}).
 *
 * <p>Free-tier stewardship: every call goes through {@link AiQuotaService} — a
 * self-imposed daily budget plus a cooldown after a Google-side 429 — so the key
 * is used to its maximum without ever getting hard-throttled.
 */
@Service
public class PortfolioAiService {

  private static final Logger log = LoggerFactory.getLogger(PortfolioAiService.class);
  private static final java.util.regex.Pattern HEX =
      java.util.regex.Pattern.compile("#[0-9A-Fa-f]{6}");
  /** Pause imposed after Google answers 429 — enough to clear an RPM window. */
  private static final long GOOGLE_THROTTLE_COOLDOWN_SECONDS = 60;

  private final GeminiClient gemini;
  private final GeminiProperties props;
  private final AiQuotaService quota;
  private final ObjectMapper mapper = new ObjectMapper();

  public PortfolioAiService(GeminiClient gemini, GeminiProperties props, AiQuotaService quota) {
    this.gemini = gemini;
    this.props = props;
    this.quota = quota;
  }

  public PortfolioDraftDto draft(AiDraftRequest req) {
    if (!props.enabled()) {
      throw ApiException.badRequest("Assistant IA non configuré (clé GEMINI_API_KEY absente).");
    }
    String brief = req == null || req.brief() == null ? "" : req.brief().trim();
    if (brief.isEmpty()) {
      throw ApiException.badRequest("Décrivez brièvement le projet pour lancer l'IA.");
    }

    // Stay inside the free tier: honour the Google-throttle cooldown, then spend
    // one unit of our daily budget. The unit is refunded if the call never lands.
    if (quota.coolingDown()) {
      throw new ApiException(429, ErrorCode.rate_limited,
          "L'assistant IA observe une courte pause (limite free-tier atteinte chez Google).");
    }
    if (!quota.tryConsume(AiQuotaService.Scope.PORTFOLIO)) {
      throw new ApiException(429, ErrorCode.rate_limited,
          "Quota IA du jour atteint (" + props.dailyLimit() + " générations)."
              + " Réessayez après minuit ou augmentez GEMINI_DAILY_LIMIT.");
    }

    String text;
    try {
      text = gemini.generate(props.baseUrl(), props.apiKey(), props.model(),
          prompt(req, brief), true, props.maxOutputTokens());
    } catch (RestClientResponseException ex) {
      quota.refund(AiQuotaService.Scope.PORTFOLIO); // Google rejected the call — don't charge our budget
      if (ex.getStatusCode().value() == 429) {
        quota.startCooldown(GOOGLE_THROTTLE_COOLDOWN_SECONDS);
        log.warn("Gemini free-tier 429 — cooldown {}s", GOOGLE_THROTTLE_COOLDOWN_SECONDS);
        throw new ApiException(429, ErrorCode.rate_limited,
            "Limite free-tier Gemini atteinte — réessai possible dans "
                + GOOGLE_THROTTLE_COOLDOWN_SECONDS + " s.");
      }
      log.warn("Gemini draft call failed ({}): {}", ex.getStatusCode().value(), ex.getMessage());
      throw new ApiException(502, ErrorCode.internal_error,
          "L'assistant IA est momentan\u00e9ment indisponible.");
    } catch (RuntimeException ex) {
      quota.refund(AiQuotaService.Scope.PORTFOLIO);
      log.warn("Gemini draft call failed: {}", ex.getMessage());
      throw new ApiException(502, ErrorCode.internal_error,
          "L'assistant IA est momentan\u00e9ment indisponible.");
    }

    JsonNode json = parseJson(text);
    List<String> tags = readTags(json);
    return new PortfolioDraftDto(
        text(json, "title"),
        text(json, "sector"),
        text(json, "service"),
        text(json, "city"),
        text(json, "summary"),
        text(json, "result"),
        tags,
        hex(json, "colorA"),
        hex(json, "colorB"));
  }

  // ---------- Internals ----------

  private String prompt(AiDraftRequest req, String brief) {
    StringBuilder sb = new StringBuilder();
    sb.append("Tu es un rédacteur web pour ROX Agency, une agence digitale marocaine. ")
        .append("À partir du brief, remplis une fiche de réalisation (case study) de portfolio ")
        .append("en FRANÇAIS : professionnelle, concrète, sobre, sans sur-promesse ni chiffre inventé.\n\n")
        .append("Brief : ").append(brief).append('\n');
    if (req.client() != null && !req.client().isBlank()) {
      sb.append("Client : ").append(req.client().trim()).append('\n');
    }
    if (req.sector() != null && !req.sector().isBlank()) {
      sb.append("Secteur connu : ").append(req.sector().trim()).append('\n');
    }
    sb.append("\nRéponds UNIQUEMENT avec un objet JSON valide contenant exactement ces clés :\n")
        .append("{\n")
        .append("  \"title\": \"titre court et accrocheur du projet\",\n")
        .append("  \"sector\": \"secteur d'activité (ex. Commerce, Restauration, Services, Santé...)\",\n")
        .append("  \"service\": \"service ROX réalisé (ex. Site vitrine + SEO local)\",\n")
        .append("  \"city\": \"ville ou zone, ou 'En ligne'\",\n")
        .append("  \"summary\": \"2 à 3 phrases : besoin du client et travail réalisé\",\n")
        .append("  \"result\": \"1 à 2 phrases : résultat et valeur livrée\",\n")
        .append("  \"tags\": [\"4 à 6 mots-clés courts\"],\n")
        .append("  \"colorA\": \"#RRGGBB\",\n")
        .append("  \"colorB\": \"#RRGGBB\"\n")
        .append("}\n")
        .append("N'invente aucune information absente du brief ; reste crédible.");
    return sb.toString();
  }

  /** Gemini may wrap JSON in fences or add prose — isolate the outermost object. */
  private JsonNode parseJson(String text) {
    if (text == null || text.isBlank()) {
      throw new ApiException(502, ErrorCode.internal_error, "Réponse IA vide.");
    }
    int start = text.indexOf('{');
    int end = text.lastIndexOf('}');
    if (start < 0 || end <= start) {
      log.warn("Gemini returned no JSON object: {}", preview(text));
      throw new ApiException(502, ErrorCode.internal_error, "Réponse IA illisible.");
    }
    try {
      return mapper.readTree(text.substring(start, end + 1));
    } catch (Exception ex) {
      throw new ApiException(502, ErrorCode.internal_error, "Réponse IA illisible.");
    }
  }

  private static String text(JsonNode n, String field) {
    if (n == null) return null;
    String v = n.path(field).asText(null);
    if (v == null) return null;
    v = v.strip();
    return v.isEmpty() ? null : v;
  }

  private static String hex(JsonNode n, String field) {
    String v = text(n, field);
    return v != null && HEX.matcher(v).matches() ? v : null;
  }

  private static List<String> readTags(JsonNode n) {
    List<String> out = new ArrayList<>();
    if (n == null) return out;
    for (JsonNode t : n.path("tags")) {
      String v = t.asText(null);
      if (v != null && !v.isBlank() && out.size() < 8) out.add(v.strip());
    }
    return out;
  }

  private static String preview(String s) {
    return s.length() > 200 ? s.substring(0, 200) + "\u2026" : s;
  }
}

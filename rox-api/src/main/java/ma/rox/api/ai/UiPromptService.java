package ma.rox.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import ma.rox.api.events.Events;
import ma.rox.api.portal.Order;
import ma.rox.api.portal.OrderRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Auto-triages every new order: asks the free-tier AI assistants to (a) judge
 * whether the client's brief is a real, actionable project or needs admin
 * intervention (vague, incomplete, gibberish/spam), and (b) turn it into a
 * copy-ready UI generation prompt for AI app builders (Lovable, Bolt, v0, Trae).
 * The verdict drives a WhatsApp alert via {@link Events.OrderTriaged}; the
 * prompt shows up in the admin order view in a copy box.
 *
 * Runs AFTER_COMMIT and async so a slow generation never delays order creation.
 * Bulk-first routing ({@link LlmRouter.Route#BULK_FIRST}) keeps this high-volume
 * task off the scarcer Gemini budget: Cloudflare answers first and Gemini only
 * takes over when Cloudflare is unavailable or throttled. Trivially-empty briefs
 * are caught by a cheap heuristic first — no API call wasted on them at all.
 */
@Service
public class UiPromptService {

  private static final Logger log = LoggerFactory.getLogger(UiPromptService.class);
  public static final String VERDICT_READY = "ready";
  public static final String VERDICT_NEEDS_ADMIN = "needs_admin";
  /** Below this, a description is a form-fill, not a brief — skip the AI call entirely. */
  private static final int MIN_BRIEF_LENGTH = 40;

  private final LlmRouter router;
  private final GeminiProperties props;
  private final OrderRepo orders;
  private final ApplicationEventPublisher events;
  private final ObjectMapper mapper = new ObjectMapper();

  public UiPromptService(LlmRouter router, GeminiProperties props,
                         OrderRepo orders, ApplicationEventPublisher events) {
    this.router = router;
    this.props = props;
    this.orders = orders;
    this.events = events;
  }

  /** Fires on every new order (client or guest lead), once the create tx commits. */
  @Async
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onOrderCreated(Events.OrderCreated e) {
    triage(e.orderId());
  }

  /** Admin-triggered re-run (quota permitting) — also used after the brief is clarified. */
  public void regenerate(String orderId) {
    triage(orderId);
  }

  @Transactional
  public void triage(String orderId) {
    if (!props.orderPromptEnabled() || !router.hasAnyConfigured()) return;
    Order o = orders.findById(orderId).orElse(null);
    if (o == null) return;

    String desc = o.getDescription() == null ? "" : o.getDescription().strip();
    if (desc.length() < MIN_BRIEF_LENGTH) {
      // Free, local heuristic: nothing to generate from — flag immediately.
      List<String> missing = List.of("Une description du projet (objectifs, cibles, contenu)");
      save(o, null, VERDICT_NEEDS_ADMIN, missing);
      events.publishEvent(new Events.OrderTriaged(o.getId(), o.getTitle(), VERDICT_NEEDS_ADMIN, missing));
      return;
    }

    String text;
    try {
      text = router.generate(LlmRouter.Route.BULK_FIRST, prompt(o),
          props.orderMaxOutputTokens()).text();
    } catch (LlmRouter.NoCapacityException ex) {
      log.info("Order triage skipped for {}: {}", orderId, ex.getMessage());
      return; // budgets exhausted / cooldown → verdict stays NULL, admin can regenerate later
    } catch (RuntimeException ex) {
      log.warn("Order triage AI call failed for {}: {}", orderId, ex.getMessage());
      return;
    }

    JsonNode json = parseJsonObject(text);
    if (json == null) {
      log.warn("Order triage: unparseable AI answer for {}", orderId);
      return;
    }
    String verdict = VERDICT_NEEDS_ADMIN.equals(json.path("verdict").asText())
        ? VERDICT_NEEDS_ADMIN : VERDICT_READY;
    List<String> missing = readMissing(json);
    String uiPrompt = textOrNull(json, "uiPrompt");
    if (VERDICT_READY.equals(verdict) && (uiPrompt == null || uiPrompt.isBlank())) {
      verdict = VERDICT_NEEDS_ADMIN; // promised a prompt but delivered none
    }
    save(o, uiPrompt, verdict, missing);
    events.publishEvent(new Events.OrderTriaged(o.getId(), o.getTitle(), verdict, missing));
  }

  // ---------- Internals ----------

  private String prompt(Order o) {
    return ("Tu es assistant de triage pour ROX Agency (agence digitale marocaine). "
        + "Une nouvelle commande vient d'arriver. Analyse le brief du client.\n\n"
        + "Titre : " + o.getTitle() + "\n"
        + "Service demandé : " + o.getService() + "\n"
        + "Budget : " + nvl(o.getBudget()) + "\n"
        + "Deadline : " + nvl(o.getDeadline()) + "\n"
        + "Description du client :\n\"\"\"\n" + o.getDescription() + "\n\"\"\"\n\n"
        + "1) VERDICT : decide si la description est un vrai projet exploitable "
        + "(projet réel, cohérent, suffisant pour démarrer) ou si elle exige une "
        + "intervention humaine (vide, vague, incohérent, charabia/spam, informations "
        + "manquantes clés). Verdict = \"ready\" ou \"needs_admin\".\n"
        + "2) MISSING : si needs_admin, liste en français 1 à 5 points précis à "
        + "demander au client (sinon liste vide).\n"
        + "3) UIPROMPT : rédige EN ANGLAIS un prompt complet de génération d'interface "
        + "prêt à coller dans Lovable / Bolt / v0 / Trae : objectif produit, public "
        + "cible, liste des pages avec leurs sections, composants et interactions, "
        + "style visuel adapté au secteur (couleurs, typographie, ambiance), "
        + "responsive mobile-first, SEO local, accessibilité. Concret et structuré ; "
        + "comble les trous avec des choix sobres cohérents, n'invente ni prix ni "
        + "faux témoignages. Si le brief est inexploitable (spam/charabia), mets uiPrompt à null.\n\n"
        + "Réponds UNIQUEMENT avec un objet JSON valide :\n"
        + "{\"verdict\": \"ready\" | \"needs_admin\", \"missing\": [\"...\"], \"uiPrompt\": \"...\"}");
  }

  private void save(Order o, String uiPrompt, String verdict, List<String> missing) {
    o.setUiPrompt(uiPrompt);
    o.setUiPromptVerdict(verdict);
    o.setUiPromptMissing(new ArrayList<>(missing));
    o.setUiPromptAt(OffsetDateTime.now());
    orders.save(o);
  }

  /** Same tolerance as PortfolioAiService: the model may wrap the JSON in prose. */
  private JsonNode parseJsonObject(String text) {
    if (text == null || text.isBlank()) return null;
    int start = text.indexOf('{');
    int end = text.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return mapper.readTree(text.substring(start, end + 1));
    } catch (Exception ex) {
      return null;
    }
  }

  private static List<String> readMissing(JsonNode n) {
    List<String> out = new ArrayList<>();
    for (JsonNode m : n.path("missing")) {
      String v = m.asText(null);
      if (v != null && !v.isBlank() && out.size() < 5) out.add(v.strip());
    }
    return out;
  }

  private static String textOrNull(JsonNode n, String field) {
    JsonNode v = n.path(field);
    if (v.isMissingNode() || v.isNull()) return null;
    String s = v.asText(null);
    return s == null || s.isBlank() ? null : s.strip();
  }

  private static String nvl(String s) { return s == null || s.isBlank() ? "non précisé" : s; }
}

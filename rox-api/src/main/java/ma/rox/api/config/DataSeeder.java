package ma.rox.api.config;

import static ma.rox.api.common.IdGen.*;

import java.util.ArrayList;
import java.util.List;
import ma.rox.api.auth.AdminAccount;
import ma.rox.api.auth.AdminRepo;
import ma.rox.api.content.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Seeds the DB on first boot so the API can serve the same content the frontend
 *  prototype shipped with (8 services, 3 plans, FAQ groups, site info, admin login).
 *  Idempotent — each seed step is skipped if its target table already has rows. */
@Component
@ConditionalOnProperty(name = "rox.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

  private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

  private final AdminRepo admins;
  private final ServiceRepo services;
  private final PlanRepo plans;
  private final FaqRepo faqs;
  private final SiteInfoRepo info;
  private final PasswordEncoder encoder;

  @Value("${rox.seed.admin-email:admin@rox.ma}") String adminEmail;
  @Value("${rox.seed.admin-password:rox-admin}") String adminPassword;

  public DataSeeder(AdminRepo admins, ServiceRepo services, PlanRepo plans, FaqRepo faqs,
                    SiteInfoRepo info, PasswordEncoder encoder) {
    this.admins = admins; this.services = services; this.plans = plans;
    this.faqs = faqs; this.info = info; this.encoder = encoder;
  }

  @Override
  @Transactional
  public void run(String... args) {
    seedAdmin();
    seedServices();
    seedPlans();
    seedFaqs();
    seedSiteInfo();
  }

  private void seedAdmin() {
    if (admins.count() > 0) return;
    AdminAccount a = new AdminAccount();
    a.setId(prefixed("a"));
    a.setEmail(adminEmail.toLowerCase());
    a.setPasswordHash(encoder.encode(adminPassword));
    a.setName("ROX Admin");
    a.setCreatedAt(nowUtc());
    admins.save(a);
    log.info("Seeded admin {} — change the password before prod.", adminEmail);
  }

  private void seedServices() {
    if (services.count() > 0) return;

    // 1 — Développement web (remplace l'ancien « Création de site web »)
    addService("developpement-web", "Développement web",
        "Sites vitrines, e-commerce, landings haute performance",
        "Globe",
        "Des sites rapides, élégants et pensés pour convertir.",
        "services",
        "Web",
        "Un site qui vend, pas juste une brochure.",
        "Nous concevons des sites sur mesure qui chargent vite, rassurent vos visiteurs et transforment le trafic en clients — du one-pager au site éditorial complet.",
        "Ce que vous obtenez",
        "Un site complet, prêt à vivre et évolutif.",
        List.of("Design sur mesure adapté à votre marque",
                "Développement responsive mobile-first",
                "Optimisation Core Web Vitals",
                "CMS ou headless selon vos besoins",
                "Formulaires, tracking & analytics",
                "Formation à l'autonomie"),
        List.of(new String[]{"Hébergement & domaine", "Nous configurons tout pour vous, sans surprise — la première année est offerte."},
                new String[]{"Maintenance", "Mises à jour, sauvegardes et correctifs de sécurité pendant 30 jours après la mise en ligne."}),
        "À partir de", "7 000 MAD");

    // 2 — Applications sur mesure & systèmes de gestion
    addService("applications-sur-mesure", "Applications & systèmes de gestion",
        "CRM, ERP, tableaux de bord, outils internes",
        "PanelsTopLeft",
        "Automatisez vos processus avec des applications taillées pour votre métier.",
        "services",
        "Sur mesure",
        "Des outils qui collent à votre réalité terrain.",
        "Nous construisons des applications web métier — CRM, ERP, plateformes internes, tableaux de bord — pensées pour votre équipe, pas pour un moule générique.",
        "Notre approche produit",
        "Cadrage, prototype, delivery, itérations.",
        List.of("Ateliers de cadrage avec vos équipes",
                "MVP livré en 4 à 8 semaines",
                "Back-end robuste + front-end soigné",
                "Authentification, rôles & permissions",
                "Intégrations : comptabilité, paiement, SMS, ERP",
                "Maintenance évolutive et documentation"),
        List.of(new String[]{"Hébergement", "Cloud managé ou déploiement sur site, selon vos contraintes."},
                new String[]{"SLA", "Support et correctifs garantis sous 4 à 24 heures ouvrées."}),
        "Sur devis", "à partir de 25 000 MAD");

    // 3 — Design UI/UX
    addService("design-ui-ux", "Design UI/UX",
        "Recherche, wireframes, design system, prototypes",
        "Figma",
        "Interfaces claires, cohérentes, orientées conversion.",
        "services",
        "Design",
        "Des interfaces qui parlent à vos utilisateurs.",
        "Nous dessinons des expériences qui guident l'utilisateur vers l'action qui compte pour vous, avec un design system propre à votre marque.",
        "Livrables",
        "Un fichier Figma structuré, prêt pour les devs.",
        List.of("Entretiens, benchmark et audit d'existant",
                "Wireframes basse-fidélité validés avec vous",
                "Design system : tokens, composants, variantes",
                "Maquettes haute-fidélité desktop + mobile",
                "Prototypes cliquables pour tester",
                "Tests utilisateurs et itérations",
                "Handoff développeurs documenté"),
        List.<String[]>of(new String[]{"Accessibilité", "Contraste et navigation clavier conformes AA."}),
        "À partir de", "5 000 MAD");

    // 4 — Applications mobiles
    addService("applications-mobiles", "Applications mobiles",
        "iOS, Android, cross-platform",
        "MonitorSmartphone",
        "Des apps natives ou cross-platform qui tiennent la charge.",
        "services",
        "Mobile",
        "Votre produit dans la poche de vos clients.",
        "Nous développons des applications iOS et Android — natives (Swift, Kotlin) ou cross-platform (React Native, Flutter) — avec le même souci de performance, de design et de robustesse.",
        "Notre stack mobile",
        "Choisie pour durer, pas pour la mode.",
        List.of("React Native ou Flutter pour un delivery rapide",
                "Natif Swift / Kotlin si la performance l'exige",
                "Notifications push iOS + Android",
                "Mode hors-ligne et synchronisation",
                "Publication App Store & Play Store incluses",
                "Analytics et crash reporting"),
        List.of(new String[]{"Maintenance", "Mises à jour OS, corrections et évolutions sur abonnement."},
                new String[]{"Design mobile", "Reprise du design system web ou création d'un système natif."}),
        "À partir de", "40 000 MAD");

    // 5 — Objets connectés & IoT
    addService("objets-connectes", "Objets connectés & IoT",
        "Capteurs, passerelles, dashboards temps réel",
        "Cpu",
        "Du firmware au tableau de bord, nous connectons vos équipements.",
        "services",
        "IoT",
        "Reliez vos équipements à votre métier.",
        "Nous concevons des solutions IoT complètes : capteurs, communication, stockage, visualisation temps réel — pour l'agriculture, l'industrie, la logistique ou le retail.",
        "Ce que nous couvrons",
        "De la couche matérielle à l'interface métier.",
        List.of("Électronique & firmware embarqué (ESP32, ARM, Raspberry Pi)",
                "Protocoles : MQTT, LoRaWAN, BLE, 4G/NB-IoT",
                "Plateforme cloud : ingestion, storage, temps réel",
                "Dashboards et alertes configurables",
                "Automatisations métier et scénarios",
                "Intégration avec vos systèmes existants (ERP, GMAO)",
                "Installation et mise en service sur site"),
        List.of(new String[]{"Prototype", "Un POC fonctionnel en 4 à 6 semaines pour valider avant d'industrialiser."},
                new String[]{"Conformité", "Aide aux démarches ANRT et certifications CE."}),
        "Sur devis", "à partir de 30 000 MAD");

    // 6 — E-commerce
    addService("ecommerce", "E-commerce",
        "Boutiques en ligne qui vendent au Maroc et à l'international",
        "ShoppingCart",
        "WooCommerce, Shopify ou stack headless, selon votre volumétrie.",
        "services",
        "E-commerce",
        "Une boutique taillée pour la conversion.",
        "Nous montons des boutiques prêtes à encaisser : paiement local (CMI, PayZone, YouCan Pay), livraison (Amine, Cathedis, Yalidine), gestion fine du stock et analytics.",
        "Ce qui est inclus",
        "Tout pour démarrer et scaler.",
        List.of("Thème ou design sur mesure orienté conversion",
                "Fiches produits & catégories optimisées SEO",
                "Paiement local et international (carte, CMI, à la livraison)",
                "Transporteurs marocains intégrés avec suivi",
                "Emails transactionnels automatisés",
                "Back-office simple pris en main par vos équipes",
                "Migration depuis Shopify, WooCommerce ou autre"),
        List.<String[]>of(new String[]{"Formation", "Prise en main du back-office et des workflows produit/commande."}),
        "À partir de", "15 000 MAD");

    // 7 — SEO & acquisition locale
    addService("seo-acquisition", "SEO & acquisition locale",
        "Google Business, contenu, netlinking, campagnes",
        "MapPin",
        "Apparaître quand on vous cherche au Maroc.",
        "services",
        "SEO",
        "Du trafic qui convertit, pas juste des visites.",
        "Stratégie SEO et acquisition orientée business : nous faisons remonter votre site sur les requêtes qui comptent, en français, arabe et darija.",
        "Notre approche",
        "Un SEO mesurable, pas des promesses creuses.",
        List.of("Audit technique + sémantique complet",
                "Optimisation on-page et contenu localisé",
                "Google Business Profile optimisé et animé",
                "Netlinking local de qualité",
                "Suivi positions, trafic et conversions",
                "Reporting mensuel commenté"),
        List.of(new String[]{"Outils", "Search Console, GA4, Ahrefs, Looker Studio."},
                new String[]{"Délais", "Premiers résultats visibles en 3 à 6 mois, consolidation sur 12 mois."}),
        "À partir de", "3 500 MAD / mois");

    // 8 — Hébergement & maintenance
    addService("hebergement-maintenance", "Hébergement & maintenance",
        "Infrastructure, mises à jour, support réactif",
        "Server",
        "Zéro downtime, zéro mauvaise surprise.",
        "services",
        "Hébergement",
        "Votre site, hébergé et veillé 24/7.",
        "Nous hébergeons votre site ou application sur une infrastructure solide (NVMe, SSL, sauvegardes) et nous l'entretenons au quotidien pour qu'il reste rapide et sûr.",
        "Inclus dans chaque offre",
        "Tout ce qu'il faut pour dormir tranquille.",
        List.of("Hébergement NVMe SSD avec CDN",
                "Certificat SSL renouvelé automatiquement",
                "Sauvegardes quotidiennes avec restauration un clic",
                "Monitoring 24/7 et alertes",
                "Mises à jour de sécurité et dépendances",
                "Support humain sous 24 h ouvrées"),
        List.<String[]>of(new String[]{"Options", "VPS managé, cloud dédié, équilibrage de charge pour les forts volumes."}),
        "À partir de", "900 MAD / mois");
  }

  private void addService(String slug, String name, String tag, String icon, String shortDesc, String faqKey,
                          String eyebrow, String title, String lead, String heading, String subtext,
                          List<String> points, List<String[]> extras, String priceLabel, String priceValue) {
    CatalogService s = new CatalogService();
    s.setId(slug);
    s.setSlug(slug);
    s.setName(name);
    s.setTag(tag);
    s.setIcon(icon);
    s.setShortDesc(shortDesc);
    s.setFaqKey(faqKey);
    s.setPublished(true);
    s.setEyebrow(eyebrow);
    s.setTitle(title);
    s.setLead(lead);
    s.setHeading(heading);
    s.setSubtext(subtext);
    s.setPoints(new ArrayList<>(points));
    s.setPriceLabel(priceLabel);
    s.setPriceValue(priceValue);
    s.setPosition((int) services.count());
    services.save(s);
    int i = 0;
    for (String[] x : extras) {
      ServiceExtra e = new ServiceExtra();
      e.setId(prefixed("x"));
      e.setService(s);
      e.setTitle(x[0]);
      e.setText(x[1]);
      e.setPosition(i++);
      s.getExtras().add(e);
    }
    services.save(s);
  }

  private void seedPlans() {
    if (plans.count() > 0) return;

    addPlan("Site web pro", "7 000 MAD", "projet",
        "Lancez votre présence en ligne avec un site vitrine rapide, bien construit et prêt pour le SEO.",
        List.of("Design sur mesure 5 à 7 pages",
                "Responsive mobile-first + Core Web Vitals",
                "SEO on-page et Google Business inclus",
                "Formation à la prise en main",
                "30 jours de support après livraison"),
        false);

    addPlan("Accompagnement mensuel", "3 500 MAD", "mois",
        "Le forfait qui fait vivre votre site, alimente votre SEO et vous garde visible — sans recruter.",
        List.of("Évolutions continues du site",
                "Contenu SEO publié chaque mois",
                "Google Business animé et avis gérés",
                "Reporting positions & trafic",
                "Support prioritaire sous 24 h"),
        true);

    addPlan("Produits sur mesure", "Sur devis", "projet",
        "Applications métier, mobile, IoT ou e-commerce avancé — cadrage produit puis delivery en itérations.",
        List.of("Ateliers de cadrage avec vos équipes",
                "Prototype ou MVP livré en 6 à 10 semaines",
                "Design system propre à votre marque",
                "Intégrations API et reprise de l'existant",
                "Maintenance évolutive et SLA"),
        false);
  }

  private void addPlan(String name, String price, String unit, String description, List<String> features, boolean highlight) {
    Plan p = new Plan();
    p.setId(prefixed("pl"));
    p.setName(name);
    p.setPrice(price);
    p.setUnit(unit);
    p.setDescription(description);
    p.setFeatures(new ArrayList<>(features));
    p.setHighlight(highlight);
    p.setPosition((int) plans.count());
    plans.save(p);
  }

  private void seedFaqs() {
    if (faqs.count() > 0) return;
    saveFaq("general", List.of(
        new FaqItemValue("Combien coûte un site web ?",
            "Nos sites vitrines démarrent à 7 000 MAD. Le prix dépend du nombre de pages, du niveau de personnalisation et des fonctionnalités (multi-langue, espace membre, e-commerce…)."),
        new FaqItemValue("Travaillez-vous avec des clients partout au Maroc ?",
            "Oui — nous accompagnons des entreprises à Casablanca, Rabat, Marrakech, Tanger, Agadir, Fès et partout ailleurs, à distance ou en personne. Nos solutions IoT sont également déployées hors Oujda."),
        new FaqItemValue("Combien de temps pour livrer un site ?",
            "Comptez 3 à 6 semaines pour un site vitrine classique, 6 à 10 semaines pour un e-commerce, et 6 à 12 semaines pour une application métier en MVP."),
        new FaqItemValue("Faites-vous des applications mobiles et des objets connectés ?",
            "Oui. Nous livrons des apps iOS/Android (React Native, Flutter ou natif) et des solutions IoT complètes, du firmware au dashboard.")));

    saveFaq("services", List.of(
        new FaqItemValue("Faites-vous du SEO local ?",
            "Oui — notre spécialité est le positionnement Google au Maroc, en français, arabe et darija."),
        new FaqItemValue("Quelle stack utilisez-vous pour les applications sur mesure ?",
            "Spring Boot / Java ou Node côté back, React ou TanStack Start côté front, PostgreSQL comme base. Pour l'IoT : ESP32 / ARM, MQTT ou LoRaWAN, et une plateforme cloud d'ingestion."),
        new FaqItemValue("Peut-on reprendre un site ou une app déjà existante ?",
            "Oui, après un audit technique et fonctionnel. Nous documentons ce qui est réutilisable, ce qui doit être refondu, et nous chiffrons la reprise avant de commencer.")));

    saveFaq("tarifs", List.of(
        new FaqItemValue("Les prix affichés sont-ils TTC ?",
            "Non, tous nos prix sont HT. Nous ajoutons la TVA (20 %) sur la facture."),
        new FaqItemValue("Peut-on payer en plusieurs fois ?",
            "Oui : 40 % à la commande, 30 % à la validation des maquettes, 30 % à la mise en ligne. Pour les abonnements mensuels, prélèvement ou virement le 5 de chaque mois."),
        new FaqItemValue("Y a-t-il des coûts cachés ?",
            "Non. Le domaine, l'hébergement et les éventuels services tiers (SMS, passerelle de paiement) sont explicités au devis.")));

    saveFaq("contact", List.of(
        new FaqItemValue("Répondez-vous rapidement ?",
            "Nous revenons vers vous sous 24 h ouvrées avec une première réponse structurée."),
        new FaqItemValue("Comment se déroule le premier échange ?",
            "Un appel de 30 minutes pour comprendre votre besoin, vos contraintes et votre timing. À la suite, nous vous envoyons une proposition écrite avec périmètre, prix et jalons.")));

    saveFaq("a-propos", List.of(
        new FaqItemValue("Qui êtes-vous ?",
            "ROX est une agence digitale basée à Oujda, composée d'un profil technique, d'un profil design et d'un réseau de freelances pour les gros projets."),
        new FaqItemValue("Pourquoi ROX plutôt qu'une grosse agence ?",
            "Un interlocuteur unique, des décisions rapides, un prix juste — et une vraie exigence sur la performance technique.")));

    saveFaq("methode", List.of(
        new FaqItemValue("Comment se déroule une collaboration ?",
            "Brief cadré → Maquette validée → Développement itératif → Lancement suivi. Chaque étape a un livrable et une date annoncée."),
        new FaqItemValue("Et après la livraison ?",
            "Formation, documentation, et une période de garantie de 30 jours. Ensuite vous pouvez repartir sur un abonnement mensuel ou nous solliciter à la demande.")));
  }

  private void saveFaq(String name, List<FaqItemValue> items) {
    FaqGroup g = new FaqGroup();
    g.setName(name);
    g.setItems(new ArrayList<>(items));
    g.setPosition((int) faqs.count());
    faqs.save(g);
  }

  private void seedSiteInfo() {
    if (info.existsById(1)) return;
    SiteInfo s = new SiteInfo();
    s.setId(1);
    s.setEmail("");
    s.setPhone("");
    s.setWhatsapp("");
    s.setPricingNote("Les prix affichés sont des points de départ. Le devis final dépend du périmètre.");
    s.setCities(new ArrayList<>(List.of("Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fès")));
    info.save(s);
  }
}

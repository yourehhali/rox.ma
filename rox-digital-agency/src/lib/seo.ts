// Shared SEO helpers: standardized <head> meta (Morocco-targeted) + JSON-LD
// structured-data builders. Keep the site honest: no invented phone/exact
// address — the LocalBusiness data only uses the city, the country and the
// cities we serve.
//
// ── EDIT ME ──────────────────────────────────────────────────────────────
// Replace SITE_URL with your real production domain so canonical + og:url are
// accurate (used for structured data and social previews).
export const SITE_URL = "https://rox.ma";
export const SITE_NAME = "ROX Agency";
export const DEFAULT_TITLE = "ROX Agency — Création de sites web & SEO au Maroc";
export const CITY = "Oujda";
export const COUNTRY = "MA";

// Cities we serve across Morocco (national positioning, remote-friendly).
export const CITIES_SERVED = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Tanger",
  "Fès",
  "Agadir",
  "Oujda",
  "Meknès",
  "Kénitra",
  "Tétouan",
  "Laâyoune",
  "Dakhlet",
] as const;

const KEYWORDS = [
  "agence web Maroc",
  "création site web Maroc",
  "SEO local Maroc",
  "agence digitale Oujda",
  "site vitrine Maroc",
  "WordPress Elementor Maroc",
  "référencement Google Maroc",
];

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  const base = SITE_URL.replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean === "/" ? "/" : clean}`;
}

export type HeadInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogType?: string;
  noindex?: boolean;
};

// Returns the `{ meta, links }` shape expected by a TanStack route `head()`.
export function seo({
  title,
  description,
  path,
  keywords,
  ogType = "website",
  noindex = false,
}: HeadInput) {
  const url = absoluteUrl(path);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: (keywords ?? KEYWORDS).join(", ") },
      { name: "robots", content: noindex ? "noindex, follow" : "index, follow" },
      { name: "theme-color", content: "#E31B23" },
      { property: "og:type", content: ogType },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "fr_MA" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

type Ld = Record<string, unknown>;

const areaServed: Ld[] = [
  { "@type": "Country", name: "Maroc" },
  ...CITIES_SERVED.map((c) => ({ "@type": "City", name: c })),
];

export function organizationLd(): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Agence digitale basée à Oujda : création de sites web rapides et bien référencés, SEO local, prototypage Figma, WordPress/Elementor et hébergement pour les entreprises marocaines.",
    areaServed,
    address: {
      "@type": "PostalAddress",
      addressLocality: CITY,
      addressCountry: COUNTRY,
    },
    priceRange: "MAD",
    knowsAbout: [
      "Création de sites web",
      "SEO local",
      "Prototypage Figma",
      "WordPress & Elementor",
      "Hébergement web",
    ],
  };
}

export function websiteLd(): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "fr-MA",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function breadcrumbLd(trail: { name: string; path: string }[]): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function serviceLd(input: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
}): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    serviceType: input.serviceType,
    areaServed,
    provider: { "@id": `${SITE_URL}/#organization` },
  };
}

export function faqLd(items: { q: string; a: string }[]): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function itemListLd(items: { name: string; description?: string }[]): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      description: it.description,
    })),
  };
}

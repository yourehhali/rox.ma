// Site content type re-exports + editor-friendly empty drafts. Content is
// fetched from the backend — SEED and localStorage helpers have been removed.

import type {
  FaqGroups,
  Plan,
  Service,
  ServiceExtra,
  ServicePage,
  SiteContent,
  SiteInfo,
} from "@/lib/api/types";

export type { FaqGroups, Plan, Service, ServiceExtra, ServicePage, SiteContent, SiteInfo };

// Editors create local drafts before the POST lands; the server assigns the
// real id. The `svc_…` / `plan_…` prefixes are just cosmetic React keys.
export function emptyService(): Service {
  return {
    id: `svc_${Date.now().toString(36)}`,
    slug: "nouveau-service",
    name: "Nouveau service",
    tag: "Service",
    icon: "Globe",
    short: "",
    faqKey: "general",
    published: false,
    page: {
      eyebrow: "Service",
      title: "Nouveau service",
      lead: "",
      heading: "",
      subtext: "",
      points: [],
      extras: [],
      priceLabel: "À partir de",
      priceValue: "",
    },
  };
}

export function emptyPlan(): Plan {
  return {
    id: `plan_${Date.now().toString(36)}`,
    name: "Nouvelle offre",
    price: "",
    unit: "",
    description: "",
    features: [],
    highlight: false,
  };
}

// Slug used as the public URL segment; keep it unique + url-safe.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const EMPTY_SITE_CONTENT: SiteContent = {
  services: [],
  plans: [],
  faqs: {},
  info: { email: "", phone: "", whatsapp: "", cities: [], pricingNote: "" },
};

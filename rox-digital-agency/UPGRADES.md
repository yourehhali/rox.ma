# ROX Agency — Upgrade Log & Context

A running record of the feature work added on top of the original marketing site.
Useful as shared context when resuming development or onboarding a new contributor.

> Project: React 19 + TanStack Start / Router (file-based routing) + Tailwind CSS v4.
> French UI copy. All admin/client features below are a **front-end prototype**:
> data and auth live in `localStorage`, with no backend yet.

---

## 1. Overview of what was added

| Area | Route | Status |
| --- | --- | --- |
| Admin dashboard | `/admin` | Prototype, wired to real client data |
| Admin login gate | `/admin` | Prototype auth |
| Theme-aware logo | global | Light + dark swap |
| Client portal (accounts, onboarding, tracking, chat, calls) | `/account` | Prototype |
| Admin ↔ client parity | `/admin` | Shared store + admin actions |
| Quote CTAs → onboarding | `/account` | Repointed |
| Service detail pages (Figma, WordPress, Hébergement) | `/services/*` | Now data-driven via `/services/$slug` |
| Morocco SEO pass (meta + JSON-LD + local content + FAQs) | all pages | Done (no backend) |
| Portfolio / "Our work" gallery | `/portfolio` | Prototype, admin-managed |
| Admin-managed site content (services, pricing, FAQ, zones/contact) | `/admin` → Contenu du site | Prototype, seed-backed store |

---

## 2. Admin dashboard

- **File-based shell**: [src/routes/admin.tsx](src/routes/admin.tsx) is gated by a
  client-side login; the dashboard switches sections on the client (single route,
  no nested admin routes).
- **Components**: [admin-sidebar.tsx](src/components/admin/admin-sidebar.tsx)
  (sidebar + `AdminBrand`), [admin-dashboard.tsx](src/components/admin/admin-dashboard.tsx)
  (layout, topbar, settings), section panels split into their own files (see §5).
- **Auth**: [use-admin-auth.ts](src/hooks/use-admin-auth.ts) — demo credentials
  `admin@rox.ma` / `rox-admin`, session key `rox-admin-auth`. Login page:
  [admin-login.tsx](src/components/admin/admin-login.tsx).
- SEO: `/admin` is `noindex`.

## 3. Theme-aware logo

- Single component: [src/components/rox/logo.tsx](src/components/rox/logo.tsx).
- Assets: light `src/assets/logo.png`, dark `src/assets/logo-darkmode.png`.
- Pure-CSS swap (`dark:hidden` / `hidden dark:block`) — same pattern as the hero, so
  no hydration flash and it reacts instantly to the theme toggle (`.dark` class +
  `rox-theme` in localStorage).
- Used in: navbar (public + home), admin sidebar/login, client login, client portal
  (sidebar, mobile top bar, welcome intro).
- **Sizes** were bumped ~one step everywhere (e.g. navbar `h-8`→`h-11`, logins
  `h-14`→`h-20`, portal intro `h-16`→`h-24`). Sizing is controlled per usage by the
  `className` passed to `<Logo>`.

## 4. Client portal (`/account`)

The client portal lets a visitor create an account **through a multi-step order
wizard**, then follow progress, request changes, chat, and book calls.

### Auth & store (prototype)
- [use-client-auth.ts](src/hooks/use-client-auth.ts) — trivial signup/login/logout
  against `localStorage` (`rox-client-accounts`, `rox-client-auth`). **Not secure**;
  placeholder for a real provider. Also exports `listClientAccounts()` for admin.
- [client-store.ts](src/lib/client-store.ts) — the data model + persistence
  (per-client key `rox-client-data:<id>`) **and the pure mutation helpers** shared by
  both the client and admin (see §5): `createOrderIn`, `advanceOrderIn`,
  `toggleTaskIn`, `setOrderStatusIn`, `requestChangeIn`, `markRequestHandledIn`,
  `sendMessageIn`, `appendRepReplyIn`, `bookCallIn`, `confirmBookingIn`.
- [client-provider.tsx](src/components/client/client-provider.tsx) +
  [client-context.ts](src/components/client/client-context.ts) — React context;
  provider delegates to the pure helpers.

### Data model
`Order` (phase `cadrage → maquette → developpement → lancement`, status
`active | Terminé`, tasks, history, requests, past services), `Task`, `OrderEvent`,
`ChangeRequest` (`update | edit`, status `ouvert | pris en compte`), `Message`
(`client | rep`), `CallBooking` (status `demandé | confirmé`).

### Features
- **Onboarding wizard**: 6 steps (activité → services → détails de la commande →
  historique des services → coordonnées → récapitulatif). The quote request *is* the
  first order. [onboarding-wizard.tsx](src/components/client/onboarding-wizard.tsx)
- **Overview / orders / order detail**: KPIs, order list, phase timeline, task
  checklist, history feed, request update/edit forms.
  [overview.tsx](src/components/client/overview.tsx),
  [orders.tsx](src/components/client/orders.tsx),
  [order-detail.tsx](src/components/client/order-detail.tsx)
- **Messages**: mock live chat (auto rep replies) + call booking.
  [messages.tsx](src/components/client/messages.tsx)
- **Profile** (read-only account). [profile.tsx](src/components/client/profile.tsx)
- Entry links: navbar + footer have "Espace client" → `/account`.

### How to test onboarding
1. `npm run dev` → http://localhost:8081 (8080 was in use).
2. Open `/account`, create an account → welcome screen → run the 6-step wizard.
3. To reset: use an incognito window, or clear `rox-client-accounts`,
   `rox-client-auth`, and `rox-client-data:<id>` in Local Storage.

## 5. Admin ↔ client parity

The admin now reads and writes the **same** store the client uses, so both sides stay
in sync (cross-tab live-sync via the `storage` event).

- [use-admin-portal.ts](src/hooks/use-admin-portal.ts) — loads every client
  account + portal data, exposes actions (advance, toggle task, set status, handle
  request, reply, confirm booking) and derived `allOrders`, `openRequests`,
  `pendingBookings`, `stats`.
- Shared pure mutations in `client-store.ts` are the single source of truth for both
  `ClientProvider` (client) and `useAdminPortal` (admin).
- **Admin sections** (nav: Overview, Commandes, Clients, Messagerie, Paramètres):
  - [overview-panel.tsx](src/components/admin/overview-panel.tsx) — real KPIs,
    services breakdown, recent orders, "à traiter" feed (traffic chart is still demo).
  - [orders-panel.tsx](src/components/admin/orders-panel.tsx) — manage an order:
    advance phases, tick tasks, mark **Terminée** / **Rouvrir**, handle requests.
  - [clients-panel.tsx](src/components/admin/clients-panel.tsx) — accounts list.
  - [messages-panel.tsx](src/components/admin/messages-panel.tsx) — reply as ROX,
    confirm call slots.
  - Demo config/nav in [data.ts](src/components/admin/data.ts).

## 6. Quote CTAs → onboarding

Decision (Option 1): every "Demander un devis" button now leads into client
onboarding and is relabeled **"Démarrer mon projet"**.

- Repointed to `/account`: `navbar.tsx` (desktop + mobile), `hero.tsx`, `cta-band.tsx`,
  `services.tsx`, `methode.tsx`, `a-propos.tsx`, `services.seo.tsx`,
  `services.creation-site-web.tsx`, and the three new pages below.
- `pricing.tsx` "Demander ce service" destination also → `/account` (label kept;
  the wizard's service step covers selection).
- The `/contact` route still exists (with its SEO title untouched) but is currently
  **orphaned** — no CTA links to it anymore.

## 7. Service detail pages

Three new static pages (mirroring the SEO / site-web layout: `PageHeader`, main card
with bullet points, 3 side cards, "Démarrer mon projet" CTA, `/tarifs` link, SEO meta):

- `/services/figma` — Prototypage Figma
- `/services/wordpress` — WordPress & Elementor
- `/services/hebergement` — Hébergement offert

All five service cards now show "En savoir plus".

## 10. Morocco SEO pass

Site-wide, national-Morocco SEO (no fabricated phone/exact address — NAP kept to
Oujda + Morocco and the cities we serve).

- **Helpers**: [src/lib/seo.ts](src/lib/seo.ts) — `seo()` returns a standardized
  `{ meta, links }` (title, description, keywords, robots, canonical, `og:locale
  fr_MA`, `og:site_name`, `og:url`, Twitter) and JSON-LD builders: `organizationLd`,
  `websiteLd`, `serviceLd`, `faqLd`, `breadcrumbLd`, `itemListLd`. `SITE_URL` is a
  **placeholder** (`https://rox.ma`) — update it to the real domain.
- **Injection**: [src/components/rox/json-ld.tsx](src/components/rox/json-ld.tsx)
  renders `<script type="application/ld+json">` in the body (SSR-safe).
  Organization + WebSite are emitted site-wide from [__root.tsx](src/routes/__root.tsx);
  each page adds Breadcrumb + (service pages) Service + (FAQ pages) FAQPage.
- **All routes** migrated to `head: () => seo({...})` with Morocco keywords.
- **Local content**: [src/components/rox/service-area.tsx](src/components/rox/service-area.tsx)
  ("Zones desservies" — Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir, Oujda, …).
- **FAQs**: reusable [Faq](src/components/rox/faq.tsx) (accepts `items` + emits
  FAQPage schema); content in [src/lib/faq-data.ts](src/lib/faq-data.ts) (`FAQS.*`).
  Tailored FAQ added to home, /services, service pages, méthode, à propos, tarifs,
  contact and portfolio.

## 11. Portfolio / "Our work"

- **Store (prototype)**: [src/lib/portfolio-store.ts](src/lib/portfolio-store.ts) —
  `PortfolioItem` model + localStorage key `rox-portfolio` + seeded sample projects
  (illustrative) + pure helpers (`upsertItemIn`, `removeItemIn`, `togglePublishedIn`,
  `toggleFeaturedIn`). [src/hooks/use-portfolio.ts](src/hooks/use-portfolio.ts) exposes
  `usePortfolio()` (admin CRUD, cross-tab sync) and `usePortfolioItems()` (public read).
- **UI**: [portfolio-card.tsx](src/components/rox/portfolio-card.tsx) (clean "Framer-like"
  gradient tile with mock-browser preview) + [portfolio-showcase.tsx](src/components/rox/portfolio-showcase.tsx)
  (home teaser) + the full page [src/routes/portfolio.tsx](src/routes/portfolio.tsx)
  (sector filter chips, grid, zones, FAQ, ItemList/Breadcrumb schema).
- **Admin**: [portfolio-panel.tsx](src/components/admin/portfolio-panel.tsx) — add/edit/
  delete, publish & feature toggles, gradient cover picker. Wired into the dashboard via
  the new `portfolio` section in [data.ts](src/components/admin/data.ts) +
  [admin-dashboard.tsx](src/components/admin/admin-dashboard.tsx).
- **Nav**: "Réalisations" added to navbar + footer.

---

## 12. Admin-managed site content (`/admin` → Contenu du site)

Everything public that should be dynamic is now editable from the admin dashboard,
following the same seed-backed `localStorage` pattern as the portfolio.

- **Store (prototype)**: [src/lib/content-store.ts](src/lib/content-store.ts) — one
  `SiteContent` object (key `rox-site-content`) holding **services** (with their full
  detail-page copy), **pricing plans**, **FAQs** (grouped) and **info** (email/phone/
  WhatsApp + `cities` + the pricing disclaimer). The `SEED` mirrors the previous hard-coded
  copy so the **server always renders real content (SEO-safe)**; admin edits persist per-browser.
  Deterministic ids (no random) keep SSR output === first client render (no hydration mismatch).
- **Hook**: [src/hooks/use-site-content.ts](src/hooks/use-site-content.ts) — `useSiteContent()`
  (public read, initial = SEED, then swaps in saved + cross-tab `storage` sync) and
  `useSiteContentAdmin()` (typed actions: saveService/removeService, savePlan/removePlan,
  setFaqs, setInfo).
- **Icons**: [src/lib/service-icons.ts](src/lib/service-icons.ts) registry maps a stored
  string to a lucide icon (`iconFor`), so the admin picks an icon without shipping components.
- **Dynamic service pages**: the 5 static `services.<slug>.tsx` routes were **deleted** and
  replaced by one catch-all [src/routes/services.$slug.tsx](src/routes/services.$slug.tsx).
  It reads the service by `slug` from the store; `head()` builds per-page meta from the seed
  (so seeded pages stay SEO-complete). Cards link via `<Link to="/services/$slug" params={{ slug }}>`.
- **Public components now read the store**: services grid, services-teaser, pricing,
  service-area (cities) and `Faq` (resolved by `group`, feeding the FAQPage schema). New
  [contact-info.tsx](src/components/rox/contact-info.tsx) renders admin-entered coordinates
  (nothing shows while blank — no fabricated NAP).
- **Admin UI**: [content-panel.tsx](src/components/admin/content-panel.tsx) is a Tabs shell over
  four editors in [src/components/admin/content/](src/components/admin/content/) — Services
  (incl. detail-page fields), Offres & tarifs, FAQ (group picker), Coordonnées & zones. Wired via
  the new `content` section in [data.ts](src/components/admin/data.ts) +
  [admin-dashboard.tsx](src/components/admin/admin-dashboard.tsx).
- **Limitations**: edits are per-browser until a backend replaces `loadSiteContent()`; a
  newly-added service (not in the seed) renders client-side but its `head()` meta falls back to
  generic on the server. `SITE_URL` in [src/lib/seo.ts](src/lib/seo.ts) is still a placeholder.

---

## 8. Conventions & gotchas (for future work)

- **Never hand-edit** `src/routeTree.gen.ts` — auto-regenerated by the dev server.
- Route naming: `services.seo.tsx` → `/services/seo`; `services.tsx` is a layout with
  `<Outlet />`. Dynamic segments use a bare `$`; splats use `$`.
- Strict TypeScript is on: `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`
  — guard array indexing and optional props.
- New JSX transform: no `import React`; use `import { type ReactNode }` when needed.
- `react-refresh/only-export-components`: keep non-component exports (constants,
  hooks, context) in separate files from components.
- Tailwind v4 tokens live in [src/styles.css](src/styles.css); utilities include
  `glass-surface`, `btn-glass-primary`, `btn-glass-secondary`. Primary red `#E31B23`.
- SSR-safety: read `localStorage` inside `useEffect` (auth status starts `"checking"`).
- This repo is connected to **Lovable** — avoid rewriting published git history.

## 9. Known prototype limitations & next steps

- No real backend: auth is bypassable, data is per-browser `localStorage`.
- Chat replies and call bookings are mock; no external providers.
- Admin traffic chart is demo data.
- To productionize: replace `client-store` persistence + auth hooks with a real API /
  DB, add real live chat (e.g. WebSocket) and a call-scheduling integration
  (e.g. Cal.com/Google Calendar) behind the **same interfaces** so the UI is unchanged.
- Open question: keep, delete, or re-link the now-orphaned `/contact` page.

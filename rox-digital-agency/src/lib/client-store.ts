// Client-domain constants + type re-exports. Data lives in the backend — this
// file only keeps the phase/service catalogues and pure helpers the UI needs
// to render labels and progress. Everything read/write has been removed.

import type {
  CallBooking,
  ChangeRequest,
  Message,
  NewOrderInput,
  Order,
  OrderEvent,
  OrderPhase,
  OrderStatus,
  PortalData,
  ServiceHistoryItem,
  Task,
} from "@/lib/api/types";

export type {
  CallBooking,
  ChangeRequest,
  Message,
  NewOrderInput,
  Order,
  OrderEvent,
  OrderPhase,
  OrderStatus,
  PortalData,
  ServiceHistoryItem,
  Task,
};

export const PHASES: { id: OrderPhase; label: string }[] = [
  { id: "cadrage", label: "Cadrage" },
  { id: "maquette", label: "Maquette Figma" },
  { id: "developpement", label: "Développement" },
  { id: "lancement", label: "Lancement & suivi" },
];

/**
 * Fallback service names used by the onboarding wizard until `useSiteContent()`
 * resolves. The canonical list lives in the backend (`service_content` table).
 * Kept in sync with `DataSeeder.addService(...)` calls.
 */
export const SERVICES = [
  "Développement web",
  "Applications & systèmes de gestion",
  "Design UI/UX",
  "Applications mobiles",
  "Objets connectés & IoT",
  "E-commerce",
  "SEO & acquisition locale",
  "Hébergement & maintenance",
  "Conseil & audit digital",
  "Automatisation & intégrations",
] as const;

export function phaseIndex(phase: OrderPhase): number {
  return PHASES.findIndex((p) => p.id === phase);
}

export function phaseProgress(phase: OrderPhase): number {
  const idx = phaseIndex(phase);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / PHASES.length) * 100);
}

/**
 * Local-only id factory used by the onboarding wizard's draft state (adding
 * rows to `pastServices` before the order is actually POSTed to the server).
 * Server-generated ids (`ord_…`, `msg_…`, …) come back from the API.
 */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export const EMPTY_PORTAL: PortalData = {
  onboarded: false,
  orders: [],
  messages: [],
  bookings: [],
};

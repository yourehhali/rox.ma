// Adapters that map the backend's on-wire DTO shape to the api-spec / UI
// shape. Kept here so services stay one-liners and tests can exercise the
// translation without any network mocking.
//
// Known divergences between the Java DTO records and api-spec.json:
//   PortalDtos.OrderDto#events  → Order#history        (list of OrderEvent)
//   PortalDtos.OrderDto#history → Order#pastServices   (list of ServiceHistoryItem)
//   PortalDtos.PortalDataDto    → PortalData (no `onboarded`; derive from orders.length)
//   PortfolioDtos.PortfolioItemDto.colors {a,b} → PortfolioItem.colorA / colorB
//   ContentDtos.ServiceDto.shortDesc (@JsonProperty("short")) → Service.short (spec)
// Backend also drops `clientId`/`orderId` on Message/CallBooking when null.

import type {
  AdminBooking,
  AdminOrder,
  CallBooking,
  ChangeRequest,
  ClientRef,
  ClientUser,
  Message,
  Order,
  OrderEvent,
  OrderPhase,
  OrderStatus,
  PortfolioItem,
  PortfolioItemInput,
  PortalData,
  Service,
  ServiceHistoryItem,
  ServiceInput,
  Task,
} from "./types";

type RawOrderEvent = { id: string; at: string; note: string };
type RawTask = { id: string; label: string; done: boolean; updatedAt: string };
type RawChangeRequest = {
  id: string;
  type: "update" | "edit";
  note: string;
  at: string;
  status: "ouvert" | "pris en compte";
};
type RawServiceHistoryItem = { id: string; service: string; year: string; outcome: string };
type RawOrder = {
  id: string;
  title: string;
  service: string;
  description: string;
  budget: string;
  deadline: string;
  phase: OrderPhase;
  status: OrderStatus;
  createdAt: string;
  tasks: RawTask[];
  events: RawOrderEvent[];
  requests: RawChangeRequest[];
  history: RawServiceHistoryItem[];
};
type RawClientRef = { id: string | null; name: string | null; email: string | null };
type RawAdminOrder = { order: RawOrder; client: RawClientRef };
type RawMessage = {
  id: string;
  clientId?: string;
  orderId?: string | null;
  at: string;
  from: "client" | "rep";
  text: string;
};
type RawCallBooking = {
  id: string;
  clientId?: string;
  date: string;
  time: string;
  subject: string;
  status: "demandé" | "confirmé";
};
type RawAdminBooking = { booking: RawCallBooking; client: RawClientRef };
type RawPortal = {
  user?: ClientUser;
  orders: RawOrder[];
  messages: RawMessage[];
  bookings: RawCallBooking[];
};

const ev = (e: RawOrderEvent): OrderEvent => ({ id: e.id, at: e.at, note: e.note });
const task = (t: RawTask): Task => ({
  id: t.id,
  label: t.label,
  done: t.done,
  updatedAt: t.updatedAt,
});
const req = (r: RawChangeRequest): ChangeRequest => ({ ...r });
const past = (h: RawServiceHistoryItem): ServiceHistoryItem => ({ ...h });

export function mapOrder(raw: RawOrder): Order {
  return {
    id: raw.id,
    title: raw.title,
    service: raw.service,
    description: raw.description,
    budget: raw.budget,
    deadline: raw.deadline,
    phase: raw.phase,
    status: raw.status,
    createdAt: raw.createdAt,
    tasks: (raw.tasks ?? []).map(task),
    history: (raw.events ?? []).map(ev),
    requests: (raw.requests ?? []).map(req),
    pastServices: (raw.history ?? []).map(past),
  };
}

export function mapClientRef(raw: RawClientRef): ClientRef {
  return { id: raw.id ?? null, name: raw.name ?? null, email: raw.email ?? null };
}

export function mapAdminOrder(raw: RawAdminOrder): AdminOrder {
  return { order: mapOrder(raw.order), client: mapClientRef(raw.client) };
}

export function mapMessage(raw: RawMessage): Message {
  const m: Message = { id: raw.id, at: raw.at, from: raw.from, text: raw.text };
  if (raw.clientId !== undefined) m.clientId = raw.clientId;
  m.orderId = raw.orderId ?? null;
  return m;
}

export function mapCallBooking(raw: RawCallBooking): CallBooking {
  const b: CallBooking = {
    id: raw.id,
    date: raw.date,
    time: raw.time,
    subject: raw.subject,
    status: raw.status,
  };
  if (raw.clientId !== undefined) b.clientId = raw.clientId;
  return b;
}

export function mapAdminBooking(raw: RawAdminBooking): AdminBooking {
  return { booking: mapCallBooking(raw.booking), client: mapClientRef(raw.client) };
}

export function mapPortal(raw: RawPortal): PortalData {
  return {
    onboarded: (raw.orders?.length ?? 0) > 0,
    orders: (raw.orders ?? []).map(mapOrder),
    messages: (raw.messages ?? []).map(mapMessage),
    bookings: (raw.bookings ?? []).map(mapCallBooking),
  };
}

// --- Portfolio --------------------------------------------------------------

type RawColors = { a?: string | null; b?: string | null } | null;
type RawPortfolioItem = {
  id: string;
  title: string;
  client: string;
  sector: string;
  service: string;
  city: string;
  summary: string;
  result: string;
  tags: string[];
  colors: RawColors;
  featured: boolean;
  published: boolean;
  createdAt: string;
};

export function mapPortfolioItem(raw: RawPortfolioItem): PortfolioItem {
  return {
    id: raw.id,
    title: raw.title,
    client: raw.client,
    sector: raw.sector,
    service: raw.service ?? "",
    city: raw.city ?? "",
    summary: raw.summary ?? "",
    result: raw.result ?? "",
    tags: raw.tags ?? [],
    colorA: raw.colors?.a ?? "#E31B23",
    colorB: raw.colors?.b ?? "#F59E0B",
    featured: !!raw.featured,
    published: !!raw.published,
    createdAt: raw.createdAt,
  };
}

export function toPortfolioItemInput(input: PortfolioItemInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: input["title"],
    client: input["client"],
    sector: input["sector"],
  };
  if (input["service"] !== undefined) body["service"] = input["service"];
  if (input["city"] !== undefined) body["city"] = input["city"];
  if (input["summary"] !== undefined) body["summary"] = input["summary"];
  if (input["result"] !== undefined) body["result"] = input["result"];
  if (input["tags"] !== undefined) body["tags"] = input["tags"];
  if (input["featured"] !== undefined) body["featured"] = input["featured"];
  if (input["published"] !== undefined) body["published"] = input["published"];
  if (input["colorA"] !== undefined || input["colorB"] !== undefined) {
    body["colors"] = { a: input["colorA"], b: input["colorB"] };
  }
  return body;
}

// --- Content ----------------------------------------------------------------

type RawServicePage = {
  eyebrow: string;
  title: string;
  lead: string;
  heading: string;
  subtext: string;
  points: string[];
  extras: { title: string; text: string }[];
  priceLabel: string;
  priceValue: string;
};
type RawService = {
  id: string;
  slug: string;
  name: string;
  tag: string;
  icon: string;
  /** @JsonProperty("short") in ContentDtos.ServiceDto. */
  short: string;
  faqKey: string;
  published: boolean;
  page: RawServicePage;
};

export function mapService(raw: RawService): Service {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    tag: raw.tag ?? "",
    icon: raw.icon ?? "Star",
    short: raw.short ?? "",
    faqKey: raw.faqKey ?? "",
    published: !!raw.published,
    page: raw.page ?? {
      eyebrow: "",
      title: raw.name,
      lead: "",
      heading: "",
      subtext: "",
      points: [],
      extras: [],
      priceLabel: "",
      priceValue: "",
    },
  };
}

export function toServiceInput(input: ServiceInput): Record<string, unknown> {
  const body: Record<string, unknown> = { slug: input["slug"], name: input["name"] };
  if (input["tag"] !== undefined) body["tag"] = input["tag"];
  if (input["icon"] !== undefined) body["icon"] = input["icon"];
  if (input["short"] !== undefined) body["short"] = input["short"];
  if (input["faqKey"] !== undefined) body["faqKey"] = input["faqKey"];
  if (input["published"] !== undefined) body["published"] = input["published"];
  if (input["page"] !== undefined) body["page"] = input["page"];
  return body;
}

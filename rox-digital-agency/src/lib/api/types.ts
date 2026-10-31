// DTO types mirroring api-spec.json (see repository root). Field names use the
// *spec* vocabulary, which is also what the UI components consume today. The
// service modules under `src/services/` adapt the backend's on-wire shape
// (PortalDtos.java + ContentDtos.java + PortfolioDtos.java) to these types.

// --- Auth -------------------------------------------------------------------

export type ClientUser = {
  id: string;
  name: string;
  /** Null for WhatsApp-only accounts (no email on file). */
  email?: string | null;
  phone?: string;
  verified?: boolean;
  createdAt?: string;
};

export type AdminUser = {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
};

export type AuthSession<TUser> = {
  user: TUser;
  accessToken: string;
  refreshToken: string;
  /** Access-token TTL in seconds, as reported by the backend. */
  accessExpiresIn: number;
};

export type ClientSession = AuthSession<ClientUser>;
export type AdminSession = AuthSession<AdminUser>;

// Client login is WhatsApp number + OTP only: no signup, no password.
// `requestClientOtp` / `verifyClientOtp` take a bare phone (+ optional code).

export type LoginInput = {
  email: string;
  password: string;
};

// --- Portal / Orders --------------------------------------------------------

export type OrderPhase = "cadrage" | "maquette" | "developpement" | "lancement";
export type OrderStatus = "active" | "Terminé";

export type Task = {
  id: string;
  label: string;
  done: boolean;
  updatedAt: string;
};

export type OrderEvent = {
  id: string;
  at: string;
  note: string;
};

export type ChangeRequest = {
  id: string;
  type: "update" | "edit";
  note: string;
  at: string;
  status: "ouvert" | "pris en compte";
};

export type ServiceHistoryItem = {
  id: string;
  service: string;
  year: string;
  outcome: string;
};

export type Order = {
  id: string;
  title: string;
  service: string;
  description: string;
  budget: string;
  deadline: string;
  phase: OrderPhase;
  status: OrderStatus;
  createdAt: string;
  tasks: Task[];
  /** UI-facing name for the ordered log of events. Backend field: `events`. */
  history: OrderEvent[];
  requests: ChangeRequest[];
  /** UI-facing name for the client's previously-purchased services. Backend field: `history`. */
  pastServices: ServiceHistoryItem[];
};

export type ClientRef = {
  /** Null for an unclaimed guest lead (no ClientAccount yet). */
  id: string | null;
  name: string | null;
  email: string | null;
};

/** Admin-only AI triage of an order's brief (UiPromptService on the API). */
export type OrderUiPrompt = {
  /** Lovable/Bolt/v0/Trae-ready UI generation prompt; null until generated. */
  prompt: string | null;
  /** "ready" = real, actionable brief · "needs_admin" = follow-up required (WhatsApp alert). */
  verdict: "ready" | "needs_admin" | null;
  /** What to ask the client when needs_admin (French, short bullets). */
  missing: string[];
  at: string | null;
};

export type AdminOrder = {
  order: Order;
  client: ClientRef;
  uiPrompt: OrderUiPrompt | null;
};

export type NewOrderInput = {
  title: string;
  service: string;
  description: string;
  budget: string;
  deadline: string;
  phone?: string;
  pastServices: Omit<ServiceHistoryItem, "id">[];
};

/**
 * Public guest-order payload — mirrors `PortalDtos.GuestOrderRequest`. Only the
 * WhatsApp `phone` and a free-text `description` are required; the order is
 * stored as an unclaimed lead keyed by phone and claimed at OTP verify. The
 * admin fleshes out the rest later.
 */
export type GuestOrderInput = {
  phone: string;
  description: string;
  name?: string | undefined;
  city?: string | undefined;
  title?: string | undefined;
  service?: string | undefined;
  budget?: string | undefined;
  deadline?: string | undefined;
  pastServices?: Omit<ServiceHistoryItem, "id">[] | undefined;
};

export type ChangeRequestInput = {
  type: "update" | "edit";
  note: string;
};

export type Message = {
  id: string;
  at: string;
  from: "client" | "rep";
  text: string;
  clientId?: string;
  orderId?: string | null;
};

export type SendMessageInput = {
  text: string;
  /** Admin-only: target thread. */
  clientId?: string;
  orderId?: string | null;
};

export type CallBooking = {
  id: string;
  date: string;
  time: string;
  subject: string;
  status: "demandé" | "confirmé";
  clientId?: string;
};

export type AdminBooking = {
  booking: CallBooking;
  client: ClientRef;
};

export type BookCallInput = {
  date: string;
  time: string;
  subject: string;
};

export type PortalData = {
  /** Derived from `orders.length > 0` — the backend does not persist this flag. */
  onboarded: boolean;
  orders: Order[];
  messages: Message[];
  bookings: CallBooking[];
};

// --- Portfolio --------------------------------------------------------------

export type PortfolioSector =
  | "Restauration"
  | "Artisanat"
  | "Commerce"
  | "Services"
  | "Santé"
  | "Automobile"
  | "Immobilier"
  | "Éducation"
  | "Beauté & Bien-être";

export type PortfolioItem = {
  id: string;
  title: string;
  client: string;
  sector: string;
  service: string;
  city: string;
  summary: string;
  result: string;
  tags: string[];
  colorA: string;
  colorB: string;
  thumbnailUrl: string;
  galleryUrls: string[];
  featured: boolean;
  published: boolean;
  createdAt: string;
};

export type PortfolioItemInput = Partial<Omit<PortfolioItem, "id" | "createdAt">> & {
  title: string;
  client: string;
  sector: string;
};

// --- Content ----------------------------------------------------------------

export type ServiceExtra = { title: string; text: string };

export type ServicePage = {
  eyebrow: string;
  title: string;
  lead: string;
  heading: string;
  subtext: string;
  points: string[];
  extras: ServiceExtra[];
  priceLabel: string;
  priceValue: string;
};

export type Service = {
  id: string;
  slug: string;
  name: string;
  tag: string;
  icon: string;
  short: string;
  faqKey: string;
  published: boolean;
  page: ServicePage;
};

export type ServiceInput = Partial<Omit<Service, "id">> & { slug: string; name: string };

export type Plan = {
  id: string;
  name: string;
  price: string;
  unit: string;
  description: string;
  features: string[];
  highlight: boolean;
};

export type PlanInput = Partial<Omit<Plan, "id">> & { name: string };

export type FaqItem = { q: string; a: string };
export type FaqGroups = Record<string, FaqItem[]>;

export type SiteInfo = {
  email: string;
  phone: string;
  whatsapp: string;
  cities: string[];
  pricingNote: string;
  // Floating WhatsApp bubble config (admin-managed under Content → Coordonnées).
  whatsappEnabled: boolean;
  whatsappMessage: string;
  whatsappPosition: "left" | "right";
};

export type SiteContent = {
  services: Service[];
  plans: Plan[];
  faqs: FaqGroups;
  info: SiteInfo;
};

// --- Analytics --------------------------------------------------------------

export type AdminStats = {
  clients: number;
  active: number;
  completed: number;
  openRequests: number;
};

export type TrafficPoint = {
  month: string;
  views: number;
  contacts: number;
};

export type TrafficRange = "6M" | "12M" | "YTD";

// --- Notifications ----------------------------------------------------------

export type NotificationKind =
  "message" | "booking" | "order" | "phase" | "stage" | "change_request" | "otp_sent";

export type AppNotification = {
  id: string;
  kind: NotificationKind | string;
  orderId: string | null;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

// --- WhatsApp (OpenWA) admin surface ----------------------------------------

/** Read model returned by `GET/PUT /admin/whatsapp/settings` — `apiKeyMasked` never carries the real secret. */
export type WhatsAppSettings = {
  enabled: boolean;
  baseUrl: string | null;
  apiKeyMasked: string | null;
  apiKeySet: boolean;
  sessionName: string | null;
  sessionId: string | null;
  messageTemplate: string | null;
  notifyEnabled: boolean;
  notifyPhone: string | null;
  updatedAt: string | null;
};

/** Write model for `PUT /admin/whatsapp/settings` — a blank/masked `apiKey` keeps the stored key. */
export type WhatsAppSettingsInput = {
  enabled?: boolean;
  baseUrl?: string;
  apiKey?: string;
  sessionName?: string;
  messageTemplate?: string;
  notifyEnabled?: boolean;
  notifyPhone?: string;
};

/** Gateway + session health for the status pill. */
export type WhatsAppStatus = {
  enabled: boolean;
  reachable: boolean;
  gatewayError: string | null;
  sessionId: string | null;
  sessionName: string | null;
  sessionStatus: string | null;
  sessionPaired: boolean;
};

/** QR payload — `qrCode` is a PNG data URL, or null when not ready. */
export type WhatsAppQr = {
  qrCode: string | null;
  status: string | null;
};

export type WhatsAppSendResult = {
  sent: boolean;
  messageId: string | null;
  error: string | null;
};

// --- Error envelope ---------------------------------------------------------

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation_error"
  | "rate_limited"
  | "internal_error"
  | string;

export type ApiErrorFieldIssue = { field: string; issue: string };

export type ApiErrorEnvelope = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorFieldIssue[];
  };
};

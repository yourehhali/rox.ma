// TanStack Query key factories. Keep them colocated with the domain module so
// `invalidateQueries(keys.content.all)` from a mutation picks up every
// dependent query automatically.

export const keys = {
  content: {
    all: ["content"] as const,
    aggregate: (all: boolean) => ["content", "aggregate", { all }] as const,
    services: (all: boolean) => ["content", "services", { all }] as const,
    serviceBySlug: (slug: string) => ["content", "service", "slug", slug] as const,
    plans: () => ["content", "plans"] as const,
    faqs: () => ["content", "faqs"] as const,
    info: () => ["content", "info"] as const,
  },
  portfolio: {
    all: ["portfolio"] as const,
    list: (all: boolean) => ["portfolio", "list", { all }] as const,
    one: (id: string) => ["portfolio", "item", id] as const,
  },
  portal: {
    all: ["portal"] as const,
    me: () => ["portal", "me"] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (role: "client" | "admin") => ["orders", "list", { role }] as const,
    one: (id: string) => ["orders", "item", id] as const,
  },
  messages: {
    all: ["messages"] as const,
    list: (clientId?: string) => ["messages", "list", { clientId: clientId ?? null }] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    list: (role: "client" | "admin") => ["bookings", "list", { role }] as const,
  },
  clients: {
    all: ["clients"] as const,
    list: () => ["clients", "list"] as const,
    portalOf: (clientId: string) => ["clients", "portal", clientId] as const,
  },
  admin: {
    all: ["admin"] as const,
    stats: () => ["admin", "stats"] as const,
    traffic: (range: string) => ["admin", "traffic", { range }] as const,
  },
  me: {
    client: () => ["me", "client"] as const,
    admin: () => ["me", "admin"] as const,
  },
} as const;

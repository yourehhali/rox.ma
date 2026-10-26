// Shared STOMP-over-WebSocket connection manager, one live socket per role
// (`client` / `admin`). Components never open sockets directly — they call
// `subscribe()` to attach handlers, and the manager reuses a single connection
// (and transparently re-subscribes after a reconnect).
//
// SSR-safe: nothing here touches the browser APIs until `connect()` runs, and
// `connect()` early-returns on the server. Importers should still guard mount
// effects with the usual `isBrowser()` where relevant.

import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { apiBase } from "./http";
import { getAccessToken, type Role } from "./token-store";

type Handler = (body: unknown, raw: IMessage) => void;

type Entry = {
  client: Client;
  // destination -> set of callbacks. Replayed on every (re)connect because the
  // broker-side subscription is lost when the socket drops.
  subs: Map<string, Set<Handler>>;
  refCount: number;
};

const pool = new Map<Role, Entry>();

function wsUrl(): string {
  const base = apiBase();
  // http -> ws, https -> wss. Strip any trailing slash then append /ws.
  const url = base.replace(/\/+$/, "").replace(/^http/, "ws");
  return `${url}/ws`;
}

function connect(entry: Entry, role: Role): void {
  const token = getAccessToken(role);
  if (!token) return; // no session — nothing to authenticate against

  entry.client = new Client({
    brokerURL: wsUrl(),
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    // Send the bearer on the CONNECT frame; the server interceptor validates it.
    connectHeaders: { Authorization: `Bearer ${token}` },
    onConnect: () => {
      // (Re)attach every desired subscription after a fresh handshake.
      for (const [dest, handlers] of entry.subs) {
        if (handlers.size === 0) continue;
        entry.client.subscribe(dest, (msg) => {
          const body = safeJson(msg.body);
          for (const h of handlers) {
            try {
              h(body, msg);
            } catch {
              /* a misbehaving subscriber must not break the frame loop */
            }
          }
        });
      }
    },
    onStompError: () => {
      /* server signalled an ERROR frame; reconnectDelay handles recovery */
    },
    onWebSocketError: () => {
      /* network blip — stompjs schedules the retry */
    },
  });

  try {
    entry.client.activate();
  } catch {
    /* activate() is best-effort; the reconcile loop retries */
  }
}

function safeJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function acquire(role: Role): Entry {
  let entry = pool.get(role);
  if (!entry) {
    entry = {
      client: new Client({ reconnectDelay: 4000 }),
      subs: new Map(),
      refCount: 0,
    };
    pool.set(role, entry);
    connect(entry, role);
  }
  entry.refCount += 1;
  return entry;
}

function release(role: Role, entry: Entry): void {
  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    try {
      entry.client.deactivate();
    } catch {
      /* ignore */
    }
    pool.delete(role);
  }
}

/**
 * Subscribe to a broker destination (`/user/queue/notifications`,
 * `/topic/admin/board`, `/topic/orders/{id}/messages`, …). Returns an
 * unsubscribe fn. The socket is opened lazily on the first subscriber for a
 * role and torn down once the last one detaches.
 */
export function subscribe(role: Role, destination: string, handler: Handler): () => void {
  if (typeof window === "undefined") return () => {};

  const entry = acquire(role);
  let set = entry.subs.get(destination);
  const isFirst = !set;
  if (!set) {
    set = new Set();
    entry.subs.set(destination, set);
  }
  set.add(handler);

  // If the socket is already established, subscribe immediately; otherwise the
  // onConnect callback will pick it up once the handshake completes.
  if (!isFirst && entry.client.connected) {
    entry.client.subscribe(destination, (msg) => {
      const body = safeJson(msg.body);
      const handlers = entry.subs.get(destination);
      if (handlers) for (const h of handlers) h(body, msg);
    });
  }

  return () => {
    const handlers = entry.subs.get(destination);
    if (handlers) {
      handlers.delete(handler);
    }
    release(role, entry);
  };
}

/** Publish to an application destination (`/app/...`). No-op when offline. */
export function publish(role: Role, destination: string, body: unknown): boolean {
  const entry = pool.get(role);
  if (!entry || !entry.client.connected) return false;
  entry.client.publish({ destination, body: JSON.stringify(body) });
  return true;
}

/** True when the role's socket currently has an OPEN STOMP session. */
export function isConnected(role: Role): boolean {
  return pool.get(role)?.client.connected ?? false;
}

/** Force-reconnect after a token refresh (drops the stale bearer). */
export function reauthenticate(role: Role): void {
  const entry = pool.get(role);
  if (!entry) return;
  try {
    entry.client.deactivate();
  } catch {
    /* ignore */
  }
  pool.delete(role);
  // Re-arm the pool entry so existing subscribers reconnect with the fresh token.
  const fresh: Entry = {
    client: new Client({ reconnectDelay: 4000 }),
    subs: entry.subs,
    refCount: entry.refCount,
  };
  pool.set(role, fresh);
  connect(fresh, role);
}

export type { StompSubscription };

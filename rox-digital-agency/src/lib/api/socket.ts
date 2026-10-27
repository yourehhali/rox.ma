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
  // destination -> set of callbacks. Desired subscriptions, kept across
  // reconnects so the broker-side subscription can be re-attached.
  subs: Map<string, Set<Handler>>;
  // destination -> the single broker subscription actually carrying `subs`.
  // Reconciled on every (re)connect *and* whenever a new destination is
  // subscribed while the socket is already OPEN — otherwise a second
  // destination (e.g. switching chat threads) would be recorded but never
  // SUBSCRIBED, and its messages would silently never arrive.
  live: Map<string, StompSubscription>;
  refCount: number;
};

const pool = new Map<Role, Entry>();

function wsUrl(): string {
  const base = apiBase();
  // http -> ws, https -> wss. Strip any trailing slash then append /ws.
  const url = base.replace(/\/+$/, "").replace(/^http/, "ws");
  return `${url}/ws`;
}

function dispatch(entry: Entry, destination: string, msg: IMessage): void {
  const body = safeJson(msg.body);
  const handlers = entry.subs.get(destination);
  if (!handlers) return;
  for (const h of handlers) {
    try {
      h(body, msg);
    } catch {
      /* a misbehaving subscriber must not break the frame loop */
    }
  }
}

/** Attach one broker subscription for `destination` if none is live yet. */
function ensureSubscribed(entry: Entry, destination: string): void {
  if (entry.live.has(destination)) return;
  if (!entry.client.connected) return; // onConnect will reconcile
  const sub = entry.client.subscribe(destination, (msg) => dispatch(entry, destination, msg));
  entry.live.set(destination, sub);
}

/**
 * Drop broker subscriptions whose destination no longer has any local handler,
 * and forget the empty handler set so a later `subscribe()` re-attaches cleanly.
 */
function reconcileSubscriptions(entry: Entry): void {
  for (const [dest, handlers] of entry.subs) {
    if (handlers.size > 0) continue;
    entry.subs.delete(dest);
    const live = entry.live.get(dest);
    if (!live) continue;
    try {
      live.unsubscribe();
    } catch {
      /* ignore */
    }
    entry.live.delete(dest);
  }
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
        ensureSubscribed(entry, dest);
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
      live: new Map(),
      refCount: 0,
    };
    pool.set(role, entry);
  }
  entry.refCount += 1;
  // Re-open the socket when the previous idle gap tore it down. The entry stays
  // in the pool, so `subs` survives teardown and `onConnect` re-attaches handlers
  // belonging to components that never unmounted (a notification socket mounted
  // by a parent shell would otherwise be silently lost for the whole session).
  if (!entry.client.active) connect(entry, role);
  return entry;
}

function release(role: Role, entry: Entry): void {
  entry.refCount -= 1;
  if (entry.refCount > 0) return;
  // Idle: drop the socket, but keep the pool entry and its desired subscriptions
  // so the next `subscribe()` transparently reconnects and replays them.
  entry.live.clear();
  try {
    entry.client.deactivate();
  } catch {
    /* ignore */
  }
}

/**
 * Subscribe to a broker destination (`/user/queue/notifications`,
 * `/topic/admin/board`, `/topic/chats/{clientId}/messages`, …). Returns an
 * unsubscribe fn. The socket is opened lazily on the first subscriber for a
 * role and torn down once the last one detaches; desired subscriptions survive
 * the idle gap and are replayed on the next (re)connect.
 */
export function subscribe(role: Role, destination: string, handler: Handler): () => void {
  if (typeof window === "undefined") return () => {};

  const entry = acquire(role);
  let set = entry.subs.get(destination);
  if (!set) {
    set = new Set();
    entry.subs.set(destination, set);
  }
  set.add(handler);

  // If the socket is already established, subscribe now; otherwise the
  // onConnect callback will pick it up once the handshake completes.
  ensureSubscribed(entry, destination);

  return () => {
    entry.subs.get(destination)?.delete(handler);
    reconcileSubscriptions(entry);
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
  // `live` is dropped with the old socket; onConnect replays `subs` on the new one.
  const fresh: Entry = {
    client: new Client({ reconnectDelay: 4000 }),
    subs: entry.subs,
    live: new Map(),
    refCount: entry.refCount,
  };
  pool.set(role, fresh);
  connect(fresh, role);
}

export type { StompSubscription };

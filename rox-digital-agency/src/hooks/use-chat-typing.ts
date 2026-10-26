// Client-scoped chat presence. Realtime *messages* already flow through the
// notification socket (each posted message raises a `message` notification that
// invalidates the portal/messages caches). This hook adds the ephemeral typing
// indicator layer on top: it joins `/topic/chats/{clientId}/typing` and exposes a
// debounced `ping()` that publishes to `/app/chats/{clientId}/typing`.
//
// The peer set auto-expires: a `typing: true` ping refreshes a 4 s TTL; without a
// `typing: false` stop event the entry still clears, so a closed tab never leaves
// a stuck indicator.

import { useCallback, useEffect, useRef, useState } from "react";
import { publish, subscribe } from "@/lib/api/socket";
import type { Role } from "@/lib/api/token-store";

export type TypingPeer = { userId: string; name: string };

type RawTyping = { userId: string; name: string; typing: boolean };

const TTL_MS = 4000;
const PING_COOLDOWN_MS = 1800;

export function useChatTyping(
  role: Role,
  clientId: string | null | undefined,
  selfUserId?: string | null,
) {
  const [peers, setPeers] = useState<Record<string, TypingPeer>>({});
  const lastPing = useRef(0);
  // Keep the latest self id in a ref so the long-lived subscription callback can
  // read it without re-subscribing every render.
  const selfRef = useRef<string | null | undefined>(selfUserId);
  selfRef.current = selfUserId;

  useEffect(() => {
    if (!clientId) return;
    const off = subscribe(role, `/topic/chats/${clientId}/typing`, (body) => {
      const t = body as RawTyping | null;
      if (!t || !t.userId) return;
      // Never show our own typing bubble.
      if (selfRef.current && t.userId === selfRef.current) return;
      setPeers((prev) => {
        const next = { ...prev };
        if (t.typing) {
          next[t.userId] = { userId: t.userId, name: t.name };
          window.setTimeout(() => {
            setPeers((cur) => {
              if (!cur[t.userId]) return cur;
              const c = { ...cur };
              delete c[t.userId];
              return c;
            });
          }, TTL_MS);
        } else {
          delete next[t.userId];
        }
        return next;
      });
    });
    return off;
  }, [role, clientId]);

  const ping = useCallback(
    (typing: boolean) => {
      if (!clientId) return;
      const now = Date.now();
      // Throttle the "still typing" heartbeats; always allow an explicit stop.
      if (typing && now - lastPing.current < PING_COOLDOWN_MS) return;
      lastPing.current = now;
      publish(role, `/app/chats/${clientId}/typing`, { typing });
    },
    [role, clientId],
  );

  const stop = useCallback(() => ping(false), [ping]);

  const list = Object.values(peers);
  return { typingNames: list.map((p) => p.name), ping, stop };
}

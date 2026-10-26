// Dual-slot bearer token store — one slot for `client`, one for `admin` so an
// admin can also browse the client portal in the same browser tab. Values are
// persisted to `localStorage`; SSR code paths must guard with `isBrowser`.

import type { AdminUser, ClientUser } from "./types";

export type Role = "client" | "admin";

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type CachedUser = ClientUser | AdminUser;

const KEY_PREFIX = "rox-token";

export const isBrowser = (): boolean => typeof window !== "undefined";

const storageKey = (role: Role): string => `${KEY_PREFIX}:${role}`;
const userKey = (role: Role): string => `${KEY_PREFIX}:${role}:user`;

function readJson<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private-mode */
  }
}

function remove(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function getToken(role: Role): TokenPair | null {
  return readJson<TokenPair>(storageKey(role));
}

export function getAccessToken(role: Role): string | null {
  return getToken(role)?.accessToken ?? null;
}

export function getRefreshToken(role: Role): string | null {
  return getToken(role)?.refreshToken ?? null;
}

export function setTokens(role: Role, pair: TokenPair): void {
  writeJson(storageKey(role), pair);
}

export function setCachedUser(role: Role, user: CachedUser | null): void {
  if (user) writeJson(userKey(role), user);
  else remove(userKey(role));
}

export function getCachedUser<T extends CachedUser>(role: Role): T | null {
  return readJson<T>(userKey(role));
}

export function clearTokens(role: Role): void {
  remove(storageKey(role));
  remove(userKey(role));
}

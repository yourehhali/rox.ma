// Thin `fetch` wrapper used by every service module.
//
//   • Base URL from `import.meta.env.VITE_API_URL` (defaults to the local dev
//     backend on :8090 — see `.env.example`).
//   • Injects `Authorization: Bearer <token>` based on the endpoint's role
//     (auto-inferred from the path prefix; overridable per call).
//   • Parses `{error:{code,message,details}}` envelopes into a typed
//     `ApiRequestError` so components can branch on `err.code`.
//   • On 401 with a role-attached token, silently rotates the refresh token
//     under a per-role mutex (parallel 401s share one refresh call) and
//     retries once. On refresh failure the tokens are cleared.

import { clearTokens, getRefreshToken, getToken, setTokens, type Role } from "./token-store";
import type { ApiErrorEnvelope, ApiErrorFieldIssue, ApiErrorCode } from "./types";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: ApiErrorFieldIssue[];

  constructor(status: number, code: ApiErrorCode, message: string, details?: ApiErrorFieldIssue[]) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    if (details) this.details = details;
  }
}

export function apiBase(): string {
  const raw = import.meta.env.VITE_API_URL ?? "http://localhost:8090";
  return raw.replace(/\/+$/, "");
}

export type FetchOpts = {
  /** Force a role slot for the bearer token; if omitted, inferred from path. */
  role?: Role | undefined;
  /** Skip bearer injection entirely (public endpoints, boot-time /auth/me). */
  anonymous?: boolean;
  /** Query string parameters; `undefined` values are dropped. */
  query?: Record<string, string | number | boolean | undefined | null> | undefined;
  /** Custom headers. */
  headers?: Record<string, string>;
  /** Only for internal retry logic. */
  _skipRefresh?: boolean;
};

// Paths that always run without a bearer. Auth endpoints except `/me` and
// `/logout` are here — the login flow uses the response payload directly and
// `logout` clears tokens locally so we don't need to keep the (soon-invalid)
// access token just to hit it.
const ANON_PATHS: ReadonlyArray<string> = [
  "/auth/client/signup",
  "/auth/client/login",
  "/auth/client/refresh",
  "/auth/admin/login",
  "/auth/admin/refresh",
];

// Explicit client-role prefixes; anything else authenticated defaults to admin.
const CLIENT_PATHS: ReadonlyArray<string> = [
  "/auth/client",
  "/portal",
  "/orders",
  "/messages",
  "/bookings",
];

function inferRole(path: string): Role {
  if (
    CLIENT_PATHS.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p + "?"))
  ) {
    return "client";
  }
  return "admin";
}

function buildUrl(path: string, query?: FetchOpts["query"]): string {
  const base = apiBase();
  const clean = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(base + clean, base);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function parseError(res: Response, path: string): Promise<ApiRequestError> {
  let code: ApiErrorCode = "internal_error";
  // Prefer the backend's French `error.message`; otherwise build a signal-rich
  // fallback so SSR/dev mistakes (wrong base URL, backend down) are debuggable
  // from the rendered error text alone.
  let message = `Requête échouée (${res.status}) sur ${path}`;
  let details: ApiErrorFieldIssue[] | undefined;
  try {
    const text = await res.text();
    if (text) {
      const body = JSON.parse(text) as Partial<ApiErrorEnvelope>;
      if (body?.error) {
        code = body.error.code ?? code;
        message = body.error.message ?? message;
        details = body.error.details;
      }
    }
  } catch {
    /* non-JSON body — keep defaults */
  }
  return new ApiRequestError(res.status, code, message, details);
}

// ---- Refresh-token mutex ---------------------------------------------------

type Inflight = { id: number; promise: Promise<boolean> };
const refreshInflight = new Map<Role, Inflight>();

async function performRefresh(role: Role): Promise<boolean> {
  const refreshToken = getRefreshToken(role);
  if (!refreshToken) return false;
  const path = role === "admin" ? "/auth/admin/refresh" : "/auth/client/refresh";
  try {
    const res = await fetch(buildUrl(path), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens(role);
      return false;
    }
    const json = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    setTokens(role, { accessToken: json.accessToken, refreshToken: json.refreshToken });
    return true;
  } catch {
    clearTokens(role);
    return false;
  }
}

function refreshOnce(role: Role): Promise<boolean> {
  const existing = refreshInflight.get(role);
  if (existing) return existing.promise;
  const promise = performRefresh(role).finally(() => {
    if (refreshInflight.get(role)?.promise === promise) refreshInflight.delete(role);
  });
  refreshInflight.set(role, { id: Date.now(), promise });
  return promise;
}

// ---- Public fetch ----------------------------------------------------------

export type ApiFetchInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<T>(
  path: string,
  init: ApiFetchInit = {},
  opts: FetchOpts = {},
): Promise<T> {
  const role = opts.role ?? inferRole(path.split("?")[0] ?? path);
  const isAnon =
    opts.anonymous === true || ANON_PATHS.some((p) => (path.startsWith(p) ? true : false));

  const headers = new Headers(init.headers ?? {});
  if (!isAnon && role) {
    const pair = getToken(role);
    if (pair?.accessToken) headers.set("authorization", `Bearer ${pair.accessToken}`);
  }
  const method = init.method ?? "GET";
  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && !headers.has("content-type")) headers.set("content-type", "application/json");
  const body = hasBody
    ? typeof init.body === "string"
      ? init.body
      : JSON.stringify(init.body)
    : undefined;

  const res = await fetch(buildUrl(path, opts.query), {
    ...init,
    method,
    headers,
    body,
  } as RequestInit);

  if (res.status === 401 && !isAnon && !opts._skipRefresh && role && getToken(role)) {
    const ok = await refreshOnce(role);
    if (ok) {
      return apiFetchWithToken<T>(path, init, opts, getToken(role)!.accessToken);
    }
    clearTokens(role);
    throw await parseError(res, path);
  }

  if (!res.ok) throw await parseError(res, path);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function apiFetchWithToken<T>(
  path: string,
  init: ApiFetchInit,
  opts: FetchOpts,
  accessToken: string,
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("authorization", `Bearer ${accessToken}`);
  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && !headers.has("content-type")) headers.set("content-type", "application/json");
  const res = await fetch(buildUrl(path, opts.query), {
    ...init,
    headers,
    body: hasBody
      ? typeof init.body === "string"
        ? init.body
        : JSON.stringify(init.body)
      : undefined,
  } as RequestInit);
  if (!res.ok) throw await parseError(res, path);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

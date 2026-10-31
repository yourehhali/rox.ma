// Resolve a stored media path (e.g. "/uploads/portfolio/x.webp") to a full URL the
// browser can load. Uploads are served by the backend, so relative paths are joined
// to the API base; absolute/data URLs pass through untouched. Returns null for empty
// input so callers can branch to the gradient fallback.

import { apiBase } from "@/lib/api/http";

export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^(https?:|data:)/i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase()}${p}`;
}

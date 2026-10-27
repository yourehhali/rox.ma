// One shared French message for any error coming out of the API layer, used by
// toasts and inline banners alike. `ApiRequestError` already carries the
// backend's localized `message`; per-field validation issues (the `details`
// array) are appended so the user sees *what* to fix, not just that it failed.

import { ApiRequestError } from "./http";

export function apiErrorMessage(
  error: unknown,
  fallback = "Une erreur est survenue. Réessayez.",
): string {
  if (error instanceof ApiRequestError) {
    const base = error.message || fallback;
    const issues = (error.details ?? []).map((d) => d.issue).filter(Boolean);
    return issues.length > 0 ? `${base} — ${issues.join(" · ")}` : base;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

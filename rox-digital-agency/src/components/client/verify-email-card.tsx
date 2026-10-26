import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/http";
import { Button } from "@/components/ui/button";

const RESEND_COOLDOWN_S = 60;

/**
 * 6-box OTP entry + resend action. Consumed both by the /verify-email route and
 * the amber banner inside the client portal. The email is required on first
 * mount (either from route state or from `window.__rox_last_email__` set by the
 * signup handler); after that, the caller can leave it undefined and we fall
 * back to the logged-in user's own email via `/auth/client/me`.
 */
export function VerifyEmailCard({
  initialEmail,
  onVerified,
  compact = false,
}: {
  initialEmail?: string | undefined;
  onVerified?: () => void;
  compact?: boolean;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "ok">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Resolve email lazily when the caller didn't pass one (banner use case).
  useEffect(() => {
    if (email) return;
    apiFetch<{ email?: string }>("/auth/client/me", { method: "GET" }, { role: "client" })
      .then((me) => setEmail(me.email ?? ""))
      .catch(() => undefined);
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const setDigit = useCallback((i: number, v: string) => {
    const clean = v.replace(/[^0-9]/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = clean;
      return next;
    });
    if (clean && i < 5) inputsRef.current[i + 1]?.focus();
  }, []);

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = text.padEnd(6, "").split("").map((c) => c || "");
    setDigits(next);
    const focusIdx = Math.min(text.length, 5);
    inputsRef.current[focusIdx]?.focus();
  };

  const submit = async () => {
    const code = digits.join("");
    if (code.length !== 6) {
      setStatus("error");
      setMessage("Code incomplet.");
      return;
    }
    setStatus("sending");
    setMessage(null);
    try {
      await apiFetch<void>(
        "/auth/client/verify",
        { method: "POST", body: { email, code } },
        { anonymous: true, role: "client" },
      );
      setStatus("ok");
      setMessage("Email vérifié. Merci !");
      onVerified?.();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Vérification impossible.");
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setStatus("sending");
    setMessage(null);
    try {
      await apiFetch<void>(
        "/auth/client/resend-otp",
        { method: "POST", body: { email } },
        { anonymous: true, role: "client" },
      );
      setCooldown(RESEND_COOLDOWN_S);
      setStatus("idle");
      setMessage("Un nouveau code vient d'être envoyé.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Envoi impossible.");
    }
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex justify-center gap-2" role="group" aria-label="Code de vérification">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            aria-label={`Chiffre ${i + 1}`}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
              if (e.key === "Enter") submit();
            }}
            onPaste={onPaste}
            className="h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-semibold outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button size="sm" onClick={submit} disabled={status === "sending"}>
          Valider
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={resend}
          disabled={cooldown > 0 || status === "sending"}
        >
          {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer le code"}
        </Button>
      </div>
      {message && (
        <p
          className={
            status === "ok"
              ? "text-sm font-medium text-emerald-600"
              : status === "error"
                ? "text-sm font-medium text-destructive"
                : "text-sm text-muted-foreground"
          }
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Phone, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/rox/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/client/otp-input";

type AuthResult = { ok: boolean; error?: string };

const PHONE_RE = /^\+?[0-9]{8,15}$/;
const RESEND_COOLDOWN_S = 60;

type ClientLoginProps = {
  onRequestOtp: (phone: string) => Promise<AuthResult>;
  onResendOtp: (phone: string) => Promise<AuthResult>;
  onVerifyOtp: (phone: string, code: string) => Promise<AuthResult>;
};

/**
 * WhatsApp-only client login. Enter the number → receive a 6-digit code over
 * WhatsApp → verify it. There is no password and no email: a matching code both
 * authenticates returning clients and creates the account on the fly (the admin
 * completes the profile later).
 */
export function ClientLogin({ onRequestOtp, onResendOtp, onVerifyOtp }: ClientLoginProps) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const sendCode = async (): Promise<void> => {
    setError(null);
    const p = phone.trim();
    if (!PHONE_RE.test(p)) {
      setError("Numéro invalide (8 à 15 chiffres, « + » optionnel).");
      return;
    }
    setBusy(true);
    const res = await onRequestOtp(p);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Envoi du code impossible.");
      return;
    }
    setCode("");
    setCooldown(RESEND_COOLDOWN_S);
    setStep("code");
  };

  const resend = async (): Promise<void> => {
    if (cooldown > 0 || busy) return;
    setError(null);
    setBusy(true);
    const res = await onResendOtp(phone.trim());
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Renvoi impossible.");
      return;
    }
    setCooldown(RESEND_COOLDOWN_S);
  };

  const verify = async (submitted: string): Promise<void> => {
    setError(null);
    if (submitted.length !== 6) return;
    setBusy(true);
    const res = await onVerifyOtp(phone.trim(), submitted);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Vérification impossible.");
      setCode("");
    }
  };

  const onPhoneSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendCode();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-20 w-20 rounded-xl object-contain" />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Espace client</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "phone"
              ? "Connectez-vous avec votre numéro WhatsApp."
              : "Saisissez le code envoyé sur WhatsApp."}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {step === "phone" ? (
            <form onSubmit={onPhoneSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="client-phone">Numéro WhatsApp</Label>
                <div className="relative">
                  <Phone
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="client-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    autoFocus
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError(null);
                    }}
                    placeholder="+212 6 12 34 56 78"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Format international. Vous recevrez un code à 6 chiffres sur WhatsApp.
                </p>
              </div>

              {error && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Envoi…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} className="mr-1" /> Envoyer le code
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              <p className="text-center text-sm text-muted-foreground">
                Code envoyé au{" "}
                <span className="font-medium text-foreground">{phone}</span>
              </p>

              <OtpInput
                value={code}
                onChange={(v) => {
                  setCode(v);
                  setError(null);
                }}
                onComplete={(v) => void verify(v)}
                disabled={busy}
                autoFocus
              />

              {error && (
                <p role="alert" className="text-center text-sm font-medium text-destructive">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep("phone")} disabled={busy}>
                  <ArrowLeft size={15} /> Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resend}
                  disabled={cooldown > 0 || busy}
                >
                  {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer le code"}
                </Button>
                <Button size="sm" onClick={() => void verify(code)} disabled={busy || code.length !== 6}>
                  Valider
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Vos informations sont transmises de façon sécurisée à l'équipe ROX.
        </p>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={15} />
            Retour au site public
          </Link>
        </div>
      </div>
    </div>
  );
}

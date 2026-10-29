import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Phone } from "lucide-react";
import { createGuestOrder } from "@/services/orders";
import * as auth from "@/services/auth";
import { OtpInput } from "@/components/client/otp-input";
import { cn } from "@/lib/utils";

const PHONE_RE = /^\+?[0-9]{8,15}$/;
const RESEND_COOLDOWN_S = 60;

// Public contact intake: two fields (WhatsApp number + description). Submitting
// files an unclaimed lead keyed by the phone and sends a WhatsApp code; entering
// the code creates the client account, claims the lead, and drops them into the
// portal. No email, no password. The admin fleshes out the order details later.
export function ContactCta() {
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false); // lead captured + OTP requested

  const phoneErr = !phone.trim()
    ? "Numéro requis."
    : !PHONE_RE.test(phone.trim())
      ? "Numéro invalide (8 à 15 chiffres, « + » optionnel)."
      : undefined;
  const descErr = !description.trim() ? "Décrivez votre projet." : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setTouched(true);
    if (phoneErr || descErr) return;

    setBusy(true);
    try {
      await createGuestOrder({ phone: phone.trim(), description: description.trim() });
      // Best-effort first send: the lead is saved either way, and the visitor
      // can always "Renvoyer le code" from the next step.
      await auth.requestClientOtp(phone.trim()).catch(() => undefined);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Envoi impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-y border-border bg-card pt-32 pb-20 sm:pt-40 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Contact</p>
            <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Parlons de votre projet.
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Décrivez ce que vous attendez d'un site web et laissez votre numéro WhatsApp. Nous
              revenons vers vous avec un premier avis et un devis clair, sans engagement.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                Réponse personnalisée, pas de réponse automatique.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                Devis détaillé avant tout début de travail.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                Échange en français ou en darija.
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-background p-6 sm:p-8">
            {sent ? (
              <VerifyCodeCard phone={phone.trim()} onBack={() => setSent(false)} />
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="contact-phone" className="text-sm font-medium">
                    Numéro WhatsApp
                  </label>
                  <div className="relative">
                    <Phone
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <input
                      id="contact-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => setTouched(true)}
                      aria-invalid={touched && !!phoneErr}
                      placeholder="+212 6 12 34 56 78"
                      className={cn(
                        "w-full rounded-md border border-input bg-card px-3 py-2.5 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                        touched && phoneErr && "border-destructive",
                      )}
                    />
                  </div>
                  {touched && phoneErr && (
                    <span className="block text-xs font-medium text-destructive">{phoneErr}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-desc" className="text-sm font-medium">
                    Votre projet
                  </label>
                  <textarea
                    id="contact-desc"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => setTouched(true)}
                    aria-invalid={touched && !!descErr}
                    placeholder="Décrivez votre activité et ce que vous recherchez…"
                    className={cn(
                      "w-full resize-y rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                      touched && descErr && "border-destructive",
                    )}
                  />
                  {touched && descErr && (
                    <span className="block text-xs font-medium text-destructive">{descErr}</span>
                  )}
                </div>

                {error && (
                  <p role="alert" className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="btn-glass-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Un instant…
                    </>
                  ) : (
                    <>
                      Recevoir mon code <ArrowRight size={16} />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  Vous recevrez un code à 6 chiffres sur WhatsApp pour créer votre espace client.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function VerifyCodeCard({ phone, onBack }: { phone: string; onBack: () => void }) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const verify = async (value: string): Promise<void> => {
    if (value.length !== 6 || busy) return;
    setError(null);
    setBusy(true);
    try {
      await auth.verifyClientOtp(phone, value);
      navigate({ to: "/account" });
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error && err.message ? err.message : "Code invalide.");
      setCode("");
    }
  };

  const resend = async (): Promise<void> => {
    if (cooldown > 0 || busy) return;
    setError(null);
    setBusy(true);
    await auth.resendClientOtp(phone).catch((err: unknown) => {
      setError(err instanceof Error && err.message ? err.message : "Renvoi impossible.");
    });
    setBusy(false);
    setCooldown(RESEND_COOLDOWN_S);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircle2 size={36} className="text-primary" strokeWidth={1.5} />
        <h2 className="font-display text-lg font-semibold">Votre demande est bien reçue</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Saisissez le code envoyé au <span className="font-medium text-foreground">{phone}</span>{" "}
          pour accéder à votre espace client.
        </p>
      </div>

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
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft size={13} /> Modifier
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0 || busy}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
          >
            {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer le code"}
          </button>
          <button
            type="button"
            onClick={() => void verify(code)}
            disabled={busy || code.length !== 6}
            className="btn-glass-primary inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : "Valider"}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        <Link to="/account" className="underline-offset-4 hover:text-foreground hover:underline">
          Plus tard
        </Link>
      </p>
    </div>
  );
}

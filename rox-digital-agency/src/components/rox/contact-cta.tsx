import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { OnboardingWizard, type GuestLead } from "@/components/client/onboarding-wizard";
import * as auth from "@/services/auth";
import { ApiRequestError } from "@/lib/api/http";

const PHONE_RE = /^\+?[0-9]{8,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,200}$/;

// Public contact intake. Instead of the old `mailto:` form (which never reached
// the dashboard), we run the 3-step guest wizard: it files the request as an
// unclaimed lead, then invites the visitor to register — signup claims the lead
// by email so they land in the portal with the order already there.
export function ContactCta() {
  const [lead, setLead] = useState<GuestLead | null>(null);

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
              Décrivez votre activité et ce que vous attendez d'un site web. Nous revenons vers vous
              avec un premier avis et un devis clair, sans engagement.
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
            {lead ? (
              <GuestRegisterCard lead={lead} onBack={() => setLead(null)} />
            ) : (
              <OnboardingWizard
                mode="guest"
                onComplete={(_orderId, result) =>
                  setLead(result ?? { name: "", email: "", phone: "" })
                }
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function GuestRegisterCard({ lead, onBack }: { lead: GuestLead; onBack: () => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState(lead.name);
  const [email, setEmail] = useState(lead.email);
  const [phone, setPhone] = useState(lead.phone);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const toPortal = () => navigate({ to: "/account" });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!EMAIL_RE.test(email.trim())) {
      setError("Adresse e-mail invalide.");
      return;
    }
    if (mode === "signup") {
      if (name.trim().length < 2) {
        setError("Indiquez votre nom.");
        return;
      }
      if (!PHONE_RE.test(phone.trim())) {
        setError("Téléphone invalide (8 à 15 chiffres, « + » optionnel).");
        return;
      }
      if (!PASSWORD_RE.test(password)) {
        setError(
          "Mot de passe trop faible : min. 8 caractères avec majuscule, minuscule et chiffre.",
        );
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        // Signup claims the guest lead server-side (matched by email).
        await auth.signupClient({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        });
      } else {
        // Login also claims any matching unclaimed lead.
        await auth.loginClient({ email: email.trim(), password });
      }
      toPortal();
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiRequestError && err.code === "conflict" && mode === "signup") {
        setMode("login");
        setInfo("Un compte existe déjà avec cet e-mail. Connectez-vous pour retrouver votre demande.");
        return;
      }
      if (
        err instanceof ApiRequestError &&
        (err.code === "unauthorized" || err.status === 401) &&
        mode === "login"
      ) {
        setError("E-mail ou mot de passe incorrect.");
        return;
      }
      setError(err instanceof Error && err.message ? err.message : "Une erreur est survenue.");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <CheckCircle2 size={40} className="text-primary" strokeWidth={1.5} />
        <h2 className="font-display text-lg font-semibold">Votre demande est bien reçue</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Créez votre espace client pour la retrouver, suivre son avancement et échanger avec
          l'équipe. Utilisez le même e-mail que votre demande.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
            setInfo(null);
          }}
          className={`rounded-md py-1.5 transition-colors ${
            mode === "signup" ? "bg-background shadow" : "text-muted-foreground"
          }`}
        >
          Créer un compte
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
            setInfo(null);
          }}
          className={`rounded-md py-1.5 transition-colors ${
            mode === "login" ? "bg-background shadow" : "text-muted-foreground"
          }`}
        >
          Se connecter
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Nom complet
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              autoComplete="name"
              className="rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.ma"
            autoComplete="username"
            className="rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </label>

        {mode === "signup" && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Téléphone
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+212 6 12 34 56 78"
              autoComplete="tel"
              className="rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </label>

        {info && <p className="text-sm font-medium text-primary">{info}</p>}
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-glass-primary mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Un instant…
            </>
          ) : (
            <>
              {mode === "signup" ? "Créer mon compte" : "Se connecter"}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft size={13} /> Modifier ma demande
        </button>
        <Link to="/account" className="underline-offset-4 hover:text-foreground hover:underline">
          Plus tard
        </Link>
      </div>
    </div>
  );
}

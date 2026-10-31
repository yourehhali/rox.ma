import { useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ClientContext } from "@/components/client/client-context";
import { SERVICES, uid, type ServiceHistoryItem } from "@/lib/client-store";
import { useSiteContent } from "@/hooks/use-site-content";
import { cn } from "@/lib/utils";

// Three-step wizard for an authenticated client: the name/WhatsApp number come
// from the account, and the order is filed directly against the current session.
// (Public visitors now use the lean WhatsApp + description intake on the contact
// page.)
const STEPS = ["Votre projet", "Détails & budget", "Coordonnées"];

const BUDGETS = [
  "2 000 – 3 000 DH",
  "3 000 – 6 000 DH",
  "6 000 – 10 000 DH",
  "Plus de 10 000 DH",
  "À définir",
];

/** Loose E.164-ish phone check mirrored on the backend. */
const PHONE_RE = /^\+?[0-9]{8,15}$/;

type FieldKey = "activity" | "services" | "title" | "description" | "phone" | "deadline";

type WizardProps = {
  onComplete: () => void;
  onCancel?: (() => void) | undefined;
  /** Prefill (and hide) the name/WhatsApp number from the signed-in account. */
  defaultName?: string;
  defaultPhone?: string;
};

export function OnboardingWizard({
  onComplete,
  onCancel,
  defaultName = "",
  defaultPhone = "",
}: WizardProps) {
  // Read the context directly (rather than `useClient()`) so the wizard stays
  // decoupled from the provider wiring.
  const clientCtx = useContext(ClientContext);
  const content = useSiteContent();
  const [step, setStep] = useState(0);
  // Slide direction for the step transition: 1 forward, -1 back.
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const [submitting, setSubmitting] = useState(false);

  const [activity, setActivity] = useState("");
  const [goal, setGoal] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState<string>(BUDGETS[0] ?? "À définir");
  const [deadline, setDeadline] = useState("");
  const [pastServices, setPastServices] = useState<ServiceHistoryItem[]>([]);
  const [phone, setPhone] = useState(defaultPhone);
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Prefer published services from the API; fall back to the static catalogue
  // while the site-content query is still loading.
  const catalogue = useMemo(() => {
    const fromApi = content.services.filter((s) => s.published).map((s) => s.name);
    return fromApi.length > 0 ? fromApi : (SERVICES as unknown as readonly string[]);
  }, [content.services]);

  const toggleService = (s: string) => {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
    setError(null);
  };

  const toggleOther = () => {
    setOtherOpen((open) => {
      const next = !open;
      if (!next) setServices((prev) => prev.filter((x) => !x.startsWith("Autre:")));
      else if (otherText.trim())
        setServices((prev) => [
          ...prev.filter((x) => !x.startsWith("Autre:")),
          `Autre: ${otherText.trim()}`,
        ]);
      return next;
    });
  };

  const updateOtherText = (v: string) => {
    setOtherText(v);
    setServices((prev) => {
      const rest = prev.filter((x) => !x.startsWith("Autre:"));
      const t = v.trim();
      return t ? [...rest, `Autre: ${t}`] : rest;
    });
    setError(null);
  };

  const addPast = () =>
    setPastServices((prev) => [...prev, { id: uid("ps"), service: "", year: "", outcome: "" }]);

  const updatePast = (id: string, patch: Partial<ServiceHistoryItem>) =>
    setPastServices((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const removePast = (id: string) => setPastServices((prev) => prev.filter((p) => p.id !== id));

  function fail(msg: string): boolean {
    setError(msg);
    return false;
  }

  // Live per-field validation: errors are derived from the values on every
  // keystroke but only surfaced once the field is blurred or "Continuer" was
  // attempted, so feedback never nags while someone is still typing.
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // The deadline must sit at least 5 days out; compared against local midnight
  // so the cutoff is date-based, not time-of-day based.
  const minDeadline = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  // `<input type="date">` min attribute — greys out earlier days in the picker.
  const minDeadlineAttr = `${minDeadline.getFullYear()}-${String(minDeadline.getMonth() + 1).padStart(2, "0")}-${String(minDeadline.getDate()).padStart(2, "0")}`;

  const fieldErrors = useMemo<Partial<Record<FieldKey, string>>>(() => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!activity.trim()) e.activity = "Décrivez votre activité.";
    if (services.length === 0) e.services = "Sélectionnez au moins un service.";
    if (!title.trim()) e.title = "Renseignez le titre du projet.";
    if (!description.trim()) e.description = "Décrivez le projet.";
    const t = phone.trim();
    if (!t) e.phone = "Le téléphone est requis.";
    else if (!PHONE_RE.test(t)) e.phone = "Format invalide (8 à 15 chiffres, « + » optionnel).";
    if (deadline) {
      const d = new Date(`${deadline}T00:00:00`);
      if (Number.isNaN(d.getTime())) e.deadline = "Date invalide.";
      else if (d < minDeadline) e.deadline = "Le délai souhaité doit être dans au moins 5 jours.";
    }
    return e;
  }, [activity, services, title, description, phone, deadline, minDeadline]);

  const stepKeys = (): FieldKey[] =>
    step === 0
      ? ["activity", "services"]
      : step === 1
        ? ["title", "description", "deadline"]
        : ["phone"];

  const showErr = (k: FieldKey) => (touched[k] ? fieldErrors[k] : undefined);
  const markTouched = (k: FieldKey) => setTouched((p) => (p[k] ? p : { ...p, [k]: true }));

  const validateStep = (): boolean => {
    const keys = stepKeys();
    setTouched((p) => {
      const n = { ...p };
      for (const k of keys) n[k] = true;
      return n;
    });
    return !keys.some((k) => fieldErrors[k]);
  };

  const next = () => {
    if (!validateStep()) return;
    setError(null);
    setDir(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError(null);
    setDir(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    if (!validateStep()) return;
    const cleanPast = pastServices.filter((p) => p.service.trim());
    // Fold `activity`/`goal` into the free-text description so the order carries
    // the same context the client typed at step 1.
    const composedDescription = [
      description.trim(),
      activity.trim() ? `Activité : ${activity.trim()}` : null,
      goal.trim() ? `Objectif : ${goal.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!clientCtx) {
      fail("Session expirée — reconnectez-vous pour envoyer votre demande.");
      return;
    }
    setSubmitting(true);
    try {
      // Await the server verdict before closing the wizard. The old fire-and-
      // forget `mutate()` + immediate `onComplete()` is what made rejected
      // orders (validation, rate limit, expired session) look like successes.
      await clientCtx.createOrder({
        title: title.trim(),
        service: services.join(" · "),
        description: composedDescription,
        budget,
        deadline: deadline || "À convenir",
        phone: phone.trim(),
        pastServices: cleanPast,
      });
    } catch {
      // The global MutationCache toast reports the failure; the wizard stays
      // open so the visitor can correct the input and retry.
      setSubmitting(false);
      return;
    }
    toast.success("Demande envoyée à l'équipe ROX.");
    onComplete();
  };

  const goSubmit = () => {
    void submit();
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Décrire votre demande</h2>
          <span className="text-xs text-muted-foreground">
            Étape {step + 1} / {STEPS.length}
          </span>
        </div>
        <Progress value={(step / (STEPS.length - 1)) * 100} className="mt-4" />
        <p className="mt-3 text-sm font-medium text-primary">{STEPS[step]}</p>
      </div>

      <div className="p-6">
        {/* Steps slide horizontally in the navigation direction */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: reduce ? 0 : 28 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduce ? 0 : -28 * dir }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && (
              <div className="space-y-5">
                <Field
                  label="Votre activité"
                  hint="Le nom et le type d'activité (ex. restaurant, cabinet, boutique)."
                  error={showErr("activity")}
                >
                  <Input
                    value={activity}
                    onChange={(e) => {
                      setActivity(e.target.value);
                      setError(null);
                    }}
                    onBlur={() => markTouched("activity")}
                    aria-invalid={!!showErr("activity")}
                    className={cn(showErr("activity") && "border-destructive")}
                    placeholder="Ex. Boutique de vêtements à Oujda"
                  />
                </Field>
                <Field
                  label="Objectif principal"
                  hint="Ce que vous attendez du projet (optionnel)."
                >
                  <Textarea
                    rows={3}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Ex. Avoir un site vitrine moderne et apparaître en premier sur Google à Oujda."
                  />
                </Field>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Quels services vous intéressent ?</p>
                  <div className="flex flex-wrap gap-2">
                    {catalogue.map((s) => {
                      const selected = services.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleService(s)}
                          aria-pressed={selected}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {selected && <Check size={14} />}
                          {s}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={toggleOther}
                      aria-pressed={otherOpen}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border border-dashed px-3.5 py-1.5 text-sm font-medium transition-colors",
                        otherOpen
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {otherOpen ? <Check size={14} /> : <Plus size={14} />}
                      Autre / précise-le
                    </button>
                  </div>
                  {otherOpen && (
                    <Input
                      autoFocus
                      value={otherText}
                      onChange={(e) => updateOtherText(e.target.value)}
                      placeholder="Décrivez le service dont vous avez besoin…"
                      className="mt-2"
                    />
                  )}
                  {showErr("services") && (
                    <p className="text-xs font-medium text-destructive">{showErr("services")}</p>
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <Field label="Titre du projet" error={showErr("title")}>
                  <Input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setError(null);
                    }}
                    onBlur={() => markTouched("title")}
                    aria-invalid={!!showErr("title")}
                    className={cn(showErr("title") && "border-destructive")}
                    placeholder="Ex. Site vitrine + SEO local"
                  />
                </Field>
                <Field
                  label="Description"
                  hint="Parlez-nous du périmètre, des pages souhaitées, de vos références."
                  error={showErr("description")}
                >
                  <Textarea
                    rows={4}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setError(null);
                    }}
                    onBlur={() => markTouched("description")}
                    aria-invalid={!!showErr("description")}
                    className={cn(showErr("description") && "border-destructive")}
                    placeholder="Décrivez votre projet…"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Budget indicatif">
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {BUDGETS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Délai souhaité"
                    hint="Optionnel — au moins 5 jours à partir d'aujourd'hui."
                    error={showErr("deadline")}
                  >
                    <Input
                      type="date"
                      value={deadline}
                      min={minDeadlineAttr}
                      onChange={(e) => {
                        setDeadline(e.target.value);
                        setError(null);
                      }}
                      onBlur={() => markTouched("deadline")}
                      aria-invalid={!!showErr("deadline")}
                      className={cn(showErr("deadline") && "border-destructive")}
                    />
                  </Field>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Services déjà commandés auparavant (optionnel).
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={addPast}>
                      <Plus size={14} /> Ajouter
                    </Button>
                  </div>
                  {pastServices.length > 0 && (
                    <div className="space-y-3">
                      {pastServices.map((p) => (
                        <div
                          key={p.id}
                          className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3"
                        >
                          <Input
                            className="min-w-[8rem] flex-1"
                            placeholder="Service"
                            value={p.service}
                            onChange={(e) => updatePast(p.id, { service: e.target.value })}
                          />
                          <Input
                            className="w-24"
                            placeholder="Année"
                            value={p.year}
                            onChange={(e) => updatePast(p.id, { year: e.target.value })}
                          />
                          <Input
                            className="min-w-[8rem] flex-1"
                            placeholder="Résultat / commentaire"
                            value={p.outcome}
                            onChange={(e) => updatePast(p.id, { outcome: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => removePast(p.id)}
                            aria-label="Retirer"
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
                  <p className="font-medium">{title || "Votre projet"}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {services.join(", ") || "—"} · {budget}
                  </p>
                </div>

                <div className="space-y-4">
                  <Field label="Nom">
                    <Input value={defaultName} readOnly disabled />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Téléphone WhatsApp"
                      hint="Le numéro de votre compte — modifiable si besoin."
                      error={showErr("phone")}
                    >
                      <Input
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setError(null);
                        }}
                        onBlur={() => markTouched("phone")}
                        aria-invalid={!!showErr("phone")}
                        className={cn(showErr("phone") && "border-destructive")}
                        placeholder="+212…"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </Field>
                    <Field label="Ville" hint="Optionnel.">
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Oujda"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}
      </div>

      <div className="flex items-center justify-between border-t border-border p-4">
        <div className="flex items-center gap-2">
          {step === 0 ? (
            onCancel && (
              <Button variant="ghost" onClick={onCancel} disabled={submitting}>
                Annuler
              </Button>
            )
          ) : (
            <Button variant="ghost" onClick={back} disabled={submitting}>
              <ArrowLeft size={16} /> Retour
            </Button>
          )}
        </div>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>
            Continuer <ArrowRight size={16} />
          </Button>
        ) : (
          <Button onClick={goSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Envoi…
              </>
            ) : (
              <>
                <Check size={16} /> Envoyer la demande
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | null | undefined;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? (
        <span className="block text-xs font-medium text-destructive">{error}</span>
      ) : (
        hint && <span className="block text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

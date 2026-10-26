import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useClient } from "@/components/client/client-context";
import { SERVICES, uid, type ServiceHistoryItem } from "@/lib/client-store";
import { useSiteContent } from "@/hooks/use-site-content";
import { cn } from "@/lib/utils";

const STEPS = [
  "Votre activité",
  "Services demandés",
  "Détails de la commande",
  "Historique des services",
  "Coordonnées",
  "Récapitulatif",
];

const BUDGETS = [
  "2 000 – 3 000 DH",
  "3 000 – 6 000 DH",
  "6 000 – 10 000 DH",
  "Plus de 10 000 DH",
  "À définir",
];

/** Loose E.164-ish phone check mirrored on the backend. */
const PHONE_RE = /^\+?[0-9]{8,15}$/;
const OTHER_PILL = "__other__";

type WizardProps = {
  onComplete: () => void;
  onCancel?: (() => void) | undefined;
};

export function OnboardingWizard({ onComplete, onCancel }: WizardProps) {
  const { createOrder } = useClient();
  const content = useSiteContent();
  const [step, setStep] = useState(0);

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
  const [phone, setPhone] = useState("");
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
        setServices((prev) => [...prev.filter((x) => !x.startsWith("Autre:")), `Autre: ${otherText.trim()}`]);
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

  const validateStep = (): boolean => {
    if (step === 0 && !activity.trim()) return fail("Décrivez votre activité.");
    if (step === 1 && services.length === 0) return fail("Sélectionnez au moins un service.");
    if (step === 2 && (!title.trim() || !description.trim()))
      return fail("Renseignez le titre et la description de la commande.");
    if (step === 4) {
      const t = phone.trim();
      if (!t) return fail("Le téléphone est requis.");
      if (!PHONE_RE.test(t)) return fail("Format de téléphone invalide (8 à 15 chiffres, « + » optionnel).");
    }
    return true;
  };

  function fail(msg: string): boolean {
    setError(msg);
    return false;
  }

  const next = () => {
    if (!validateStep()) return;
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = () => {
    if (!PHONE_RE.test(phone.trim())) {
      setStep(4);
      fail("Merci de renseigner un téléphone valide.");
      return;
    }
    const cleanPast = pastServices.filter((p) => p.service.trim());
    createOrder({
      title: title.trim(),
      service: services.join(" · "),
      description: description.trim(),
      budget,
      deadline: deadline || "À convenir",
      phone: phone.trim(),
      pastServices: cleanPast,
    });
    onComplete();
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
        {step === 0 && (
          <div className="space-y-4">
            <Field
              label="Votre activité"
              hint="Le nom et le type d'activité (ex. restaurant, cabinet, boutique)."
            >
              <Input
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="Ex. Boutique de vêtements à Oujda"
              />
            </Field>
            <Field label="Objectif principal" hint="Ce que vous attendez du projet (optionnel).">
              <Textarea
                rows={3}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ex. Avoir un site vitrine moderne et apparaître en premier sur Google à Oujda."
              />
            </Field>
          </div>
        )}

        {step === 1 && (
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
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Field label="Titre de la commande">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Site vitrine + SEO local"
              />
            </Field>
            <Field
              label="Description"
              hint="Parlez-nous du périmètre, des pages souhaitées, de vos références."
            >
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
              <Field label="Délai souhaité">
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Services déjà commandés auparavant (optionnel).
              </p>
              <Button type="button" variant="outline" size="sm" onClick={addPast}>
                <Plus size={14} /> Ajouter
              </Button>
            </div>
            {pastServices.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Aucun service ajouté pour l'instant.
              </p>
            ) : (
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
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone" hint="Requis. Format international, ex. +212 6 12 34 56 78.">
                <Input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212…"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Ville" hint="Optionnel.">
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Oujda" />
              </Field>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 text-sm">
            <Summary label="Activité" value={activity} />
            <Summary label="Objectif" value={goal || "—"} />
            <Summary label="Services" value={services.join(", ")} />
            <Summary label="Commande" value={`${title} — ${description}`} />
            <Summary label="Budget" value={budget} />
            <Summary label="Délai" value={deadline || "À convenir"} />
            <Summary
              label="Historique"
              value={
                pastServices
                  .filter((p) => p.service.trim())
                  .map((p) => `${p.service}${p.year ? ` (${p.year})` : ""}`)
                  .join(", ") || "—"
              }
            />
            <Summary label="Téléphone" value={phone} />
            <Summary label="Ville" value={city || "—"} />
          </div>
        )}

        {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}
      </div>

      <div className="flex items-center justify-between border-t border-border p-4">
        <div className="flex items-center gap-2">
          {step === 0 ? (
            onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Annuler
              </Button>
            )
          ) : (
            <Button variant="ghost" onClick={back}>
              <ArrowLeft size={16} /> Retour
            </Button>
          )}
        </div>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>
            Continuer <ArrowRight size={16} />
          </Button>
        ) : (
          <Button onClick={submit}>
            <Check size={16} /> Envoyer la demande
          </Button>
        )}
      </div>
    </div>
  );
}

// Silence unused-reference warnings when tree-shaking strips the constant in dev.
void OTHER_PILL;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

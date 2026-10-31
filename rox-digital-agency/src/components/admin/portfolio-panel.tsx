import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Eye,
  EyeOff,
  ImagePlus,
  Images,
  Loader2,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePortfolio } from "@/hooks/use-portfolio";
import { SECTORS, emptyDraft, type PortfolioItem } from "@/lib/portfolio-store";
import { mediaUrl } from "@/lib/media";
import {
  aiDraftPortfolio,
  getAiQuota,
  uploadPortfolioMedia,
  type PortfolioAiQuota,
} from "@/services/portfolio";

// Free-tier helpers: one short line under the AI button telling the admin what's
// left of today's Gemini budget, and whether the assistant is currently paused.
function quotaBlocked(q: PortfolioAiQuota | null): boolean {
  if (!q) return false; // unknown — let the server decide
  return !q.enabled || q.coolingDown || q.remainingToday <= 0;
}

function quotaLine(q: PortfolioAiQuota | null): string {
  if (!q) return "";
  if (!q.enabled) return "Assistant IA non configuré côté serveur (GEMINI_API_KEY).";
  if (q.coolingDown) {
    return `Pause après limite free-tier Google — réessai dans ~${q.cooldownSeconds} s.`;
  }
  if (q.remainingToday <= 0) {
    const h = Math.max(1, Math.round(q.resetInSeconds / 3600));
    return `Quota du jour épuisé (${q.dailyLimit}/jour) — retour dans ~${h} h.`;
  }
  return `Free-tier : ${q.remainingToday}/${q.dailyLimit} générations restantes aujourd'hui.`;
}

export function PortfolioPanel() {
  const { items, ready, actions } = usePortfolio();
  const [draft, setDraft] = useState<PortfolioItem | null>(null);
  const [tagsText, setTagsText] = useState("");
  const [brief, setBrief] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [quota, setQuota] = useState<PortfolioAiQuota | null>(null);
  const [thumbBusy, setThumbBusy] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Free-tier budget for the "Remplir avec l'IA" panel. Best-effort: the assistant
  // still works (server-guarded) if this read fails, the chip just stays hidden.
  const refreshQuota = () => {
    getAiQuota()
      .then(setQuota)
      .catch(() => setQuota(null));
  };
  useEffect(refreshQuota, []);

  const openNew = () => {
    setDraft(emptyDraft());
    setTagsText("");
  };

  const openEdit = (item: PortfolioItem) => {
    setDraft({ ...item });
    setTagsText(item.tags.join(", "));
  };

  const close = () => {
    setDraft(null);
    setTagsText("");
  };

  const save = () => {
    if (!draft) return;
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    actions.save({ ...draft, tags });
    close();
  };

  const patch = (p: Partial<PortfolioItem>) => setDraft((d) => (d ? { ...d, ...p } : d));

  // Fill the form from a short brief via Gemini. Only touches local draft state —
  // nothing is written to the DB until the admin presses "Enregistrer".
  const runAi = async () => {
    if (!draft) return;
    const text = brief.trim();
    if (!text) {
      toast.error("Décrivez d'abord le projet dans le champ « Brief ».");
      return;
    }
    setAiBusy(true);
    try {
      const d = await aiDraftPortfolio(text, draft.client, draft.sector);
      patch({
        title: d.title ?? draft.title,
        sector: d.sector ?? draft.sector,
        service: d.service ?? draft.service,
        city: d.city ?? draft.city,
        summary: d.summary ?? draft.summary,
        result: d.result ?? draft.result,
        colorA: d.colorA ?? draft.colorA,
        colorB: d.colorB ?? draft.colorB,
      });
      if (d.tags?.length) setTagsText(d.tags.join(", "));
      toast.success("Brouillon IA généré — vérifiez puis enregistrez.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la génération IA.");
    } finally {
      setAiBusy(false);
      refreshQuota();
    }
  };

  const onThumbFile = async (file?: File) => {
    if (!file || !draft) return;
    setThumbBusy(true);
    try {
      patch({ thumbnailUrl: await uploadPortfolioMedia(file) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Téléversement échoué.");
    } finally {
      setThumbBusy(false);
      if (thumbInputRef.current) thumbInputRef.current.value = "";
    }
  };

  const onGalleryFiles = async (files?: FileList | null) => {
    if (!files || files.length === 0 || !draft) return;
    setGalleryBusy(true);
    const added: string[] = [];
    for (const f of Array.from(files)) {
      try {
        added.push(await uploadPortfolioMedia(f));
      } catch (err) {
        toast.error(`${f.name}: ${err instanceof Error ? err.message : "échec"}`);
      }
    }
    if (added.length) patch({ galleryUrls: [...draft.galleryUrls, ...added] });
    setGalleryBusy(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {ready ? (
            <>
              {items.length} réalisation{items.length > 1 ? "s" : ""} ·{" "}
              {items.filter((i) => i.published).length} publiée
              {items.filter((i) => i.published).length > 1 ? "s" : ""}
            </>
          ) : (
            "Chargement…"
          )}
        </p>
        <Button onClick={openNew} size="sm">
          <Plus size={15} /> Nouvelle réalisation
        </Button>
      </div>

      {draft ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>
                {items.some((i) => i.id === draft.id) ? "Modifier" : "Nouvelle réalisation"}
              </CardTitle>
              <CardDescription>
                Les champs alimentent la page publique « Réalisations ».
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={close}>
              <X size={15} /> Fermer
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles size={15} className="text-primary" /> Remplir avec l'IA
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Décrivez le projet en quelques mots : l'assistant pré-remplit le formulaire. Rien
                n'est enregistré tant que vous ne cliquez pas sur « Enregistrer ».
              </p>
              <Textarea
                rows={2}
                maxLength={400}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Ex. Restaurant à Oujda, besoin d'un site vitrine rapide avec menu et réservation WhatsApp."
                className="mt-3"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">{quotaLine(quota)}</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={runAi}
                  disabled={aiBusy || quotaBlocked(quota)}
                >
                  {aiBusy ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Génération…
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Générer le brouillon
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Titre du projet">
                <Input
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="Ex. Réservation en ligne…"
                />
              </Field>
              <Field label="Client">
                <Input
                  value={draft.client}
                  onChange={(e) => patch({ client: e.target.value })}
                  placeholder="Nom de l'entreprise"
                />
              </Field>
              <Field label="Secteur">
                <select
                  value={draft.sector}
                  onChange={(e) => patch({ sector: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Service réalisé">
                <Input
                  value={draft.service}
                  onChange={(e) => patch({ service: e.target.value })}
                  placeholder="Site vitrine + SEO local"
                />
              </Field>
              <Field label="Ville">
                <Input
                  value={draft.city}
                  onChange={(e) => patch({ city: e.target.value })}
                  placeholder="Oujda, Casablanca…"
                />
              </Field>
              <Field label="Étiquettes (séparées par des virgules)">
                <Input
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="WordPress, Mobile-first, …"
                />
              </Field>
            </div>

            <Field label="Résumé">
              <Textarea
                rows={2}
                value={draft.summary}
                onChange={(e) => patch({ summary: e.target.value })}
                placeholder="Ce que nous avons fait."
              />
            </Field>
            <Field label="Résultat / impact">
              <Textarea
                rows={2}
                value={draft.result}
                onChange={(e) => patch({ result: e.target.value })}
                placeholder="Ex. Référencé en 1ʳᵉ page sur « … »."
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Couleur de départ">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft.colorA}
                    onChange={(e) => patch({ colorA: e.target.value })}
                    className="h-9 w-12 cursor-pointer rounded border border-input bg-background"
                  />
                  <Input value={draft.colorA} onChange={(e) => patch({ colorA: e.target.value })} />
                </div>
              </Field>
              <Field label="Couleur d'arrivée">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft.colorB}
                    onChange={(e) => patch({ colorB: e.target.value })}
                    className="h-9 w-12 cursor-pointer rounded border border-input bg-background"
                  />
                  <Input value={draft.colorB} onChange={(e) => patch({ colorB: e.target.value })} />
                </div>
              </Field>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => patch({ featured: e.target.checked })}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Mettre à la une
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(e) => patch({ published: e.target.checked })}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Publier sur le site
              </label>
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-medium">Miniature (optionnelle)</span>
              <div className="flex items-center gap-3">
                {draft.thumbnailUrl ? (
                  <img
                    src={mediaUrl(draft.thumbnailUrl) ?? ""}
                    alt=""
                    className="h-16 w-24 rounded-md border border-border object-cover"
                  />
                ) : (
                  <span
                    className="h-16 w-24 rounded-md border border-border"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${draft.colorA}, ${draft.colorB})`,
                    }}
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={thumbBusy}
                  >
                    {thumbBusy ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ImagePlus size={14} />
                    )}{" "}
                    {draft.thumbnailUrl ? "Remplacer" : "Téléverser"}
                  </Button>
                  {draft.thumbnailUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => patch({ thumbnailUrl: "" })}
                    >
                      <X size={14} /> Retirer
                    </Button>
                  ) : null}
                </div>
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onThumbFile(e.target.files?.[0])}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sans image, la carte garde le dégradé actuel.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-medium">Galerie ({draft.galleryUrls.length})</span>
              <div className="flex flex-wrap gap-2">
                {draft.galleryUrls.map((g, i) => (
                  <div key={g} className="relative">
                    <img
                      src={mediaUrl(g) ?? ""}
                      alt=""
                      loading="lazy"
                      className="h-20 w-28 rounded-md border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        patch({ galleryUrls: draft.galleryUrls.filter((_, j) => j !== i) })
                      }
                      aria-label="Retirer l'image"
                      className="absolute -right-2 -top-2 rounded-full border border-border bg-background p-0.5 text-muted-foreground hover:text-destructive"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={galleryBusy}
                  className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50"
                >
                  {galleryBusy ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ImagePlus size={16} />
                  )}
                  Ajouter
                </button>
              </div>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onGalleryFiles(e.target.files)}
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border p-3">
              <span className="text-xs font-medium text-muted-foreground">
                Aperçu de la couverture :
              </span>
              <span
                className="h-10 flex-1 rounded-md"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${draft.colorA}, ${draft.colorB})`,
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={close}>
                Annuler
              </Button>
              <Button onClick={save} disabled={!draft.title.trim() || !draft.client.trim()}>
                <Save size={15} /> Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!ready ? (
        <p className="text-sm text-muted-foreground">Chargement des réalisations…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Images size={26} />
            Aucune réalisation pour le moment. Cliquez sur « Nouvelle réalisation » pour remplir la
            galerie.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <span
                  className="h-12 w-16 shrink-0 rounded-md"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${item.colorA}, ${item.colorB})`,
                  }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{item.title || "Sans titre"}</p>
                    {item.featured ? (
                      <Badge variant="secondary" className="shrink-0 gap-1">
                        <Star size={11} className="fill-current" /> À la une
                      </Badge>
                    ) : null}
                    <Badge variant={item.published ? "default" : "outline"} className="shrink-0">
                      {item.published ? "Publiée" : "Brouillon"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {item.client} · {item.sector} · {item.city}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => actions.togglePublished(item.id)}
                    aria-label="Publier / dépublier"
                  >
                    {item.published ? <EyeOff size={15} /> : <Eye size={15} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => actions.toggleFeatured(item.id)}
                    aria-label="Mettre à la une"
                  >
                    <Star
                      size={15}
                      className={item.featured ? "fill-current text-amber-500" : ""}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(item)}
                    aria-label="Modifier"
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Supprimer « ${item.client || item.title} » ?`))
                        actions.remove(item.id);
                    }}
                    aria-label="Supprimer"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </Label>
  );
}

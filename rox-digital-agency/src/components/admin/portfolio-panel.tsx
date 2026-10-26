import { useState, type ReactNode } from "react";
import { Eye, EyeOff, Images, Pencil, Plus, Save, Star, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePortfolio } from "@/hooks/use-portfolio";
import { SECTORS, emptyDraft, type PortfolioItem } from "@/lib/portfolio-store";

export function PortfolioPanel() {
  const { items, ready, actions } = usePortfolio();
  const [draft, setDraft] = useState<PortfolioItem | null>(null);
  const [tagsText, setTagsText] = useState("");

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

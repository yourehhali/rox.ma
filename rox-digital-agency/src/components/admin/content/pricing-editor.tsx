import { useState } from "react";
import { Pencil, Plus, Save, Star, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSiteContentAdmin } from "@/hooks/use-site-content";
import { emptyPlan, type Plan } from "@/lib/content-store";
import { Field, ListEditor } from "./shared";

export function PricingEditor() {
  const { content, actions } = useSiteContentAdmin();
  const [draft, setDraft] = useState<Plan | null>(null);
  const [note, setNote] = useState(content.info.pricingNote);

  const openNew = () => setDraft(emptyPlan());
  const openEdit = (p: Plan) => setDraft({ ...p, features: [...p.features] });
  const close = () => setDraft(null);
  const patch = (p: Partial<Plan>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const save = () => {
    if (!draft) return;
    actions.savePlan({
      ...draft,
      name: draft.name.trim() || "Offre sans titre",
      features: draft.features.map((f) => f.trim()).filter(Boolean),
    });
    close();
  };

  const saveNote = () => actions.setInfo({ pricingNote: note.trim() });

  if (draft) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>
              {content.plans.some((p) => p.id === draft.id) ? "Modifier l'offre" : "Nouvelle offre"}
            </CardTitle>
            <CardDescription>Alimente la page « Tarifs ».</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={close}>
            <X size={15} /> Fermer
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom de l'offre">
              <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
            </Field>
            <Field label="Prix">
              <Input
                value={draft.price}
                onChange={(e) => patch({ price: e.target.value })}
                placeholder="2 000 – 3 000 DH"
              />
            </Field>
            <Field label="Unité / période">
              <Input
                value={draft.unit}
                onChange={(e) => patch({ unit: e.target.value })}
                placeholder="forfait de départ"
              />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={draft.highlight}
                onChange={(e) => patch({ highlight: e.target.checked })}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Mettre en avant (« Le plus demandé »)
            </label>
          </div>

          <Field label="Description">
            <Textarea
              rows={2}
              value={draft.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </Field>

          <ListEditor
            label="Caractéristiques incluses"
            items={draft.features}
            onChange={(features) => patch({ features })}
            placeholder="Une prestation…"
            addLabel="Ajouter une caractéristique"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close}>
              Annuler
            </Button>
            <Button onClick={save} disabled={!draft.name.trim()}>
              <Save size={15} /> Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {content.plans.length} offre{content.plans.length > 1 ? "s" : ""}
        </p>
        <Button onClick={openNew} size="sm">
          <Plus size={15} /> Nouvelle offre
        </Button>
      </div>

      <div className="space-y-3">
        {content.plans.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{p.name}</p>
                  {p.highlight ? (
                    <Badge variant="secondary" className="shrink-0 gap-1">
                      <Star size={11} className="fill-current" /> En avant
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {p.price} {p.unit && `· ${p.unit}`} · {p.features.length} inclus
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => actions.savePlan({ ...p, highlight: !p.highlight })}
                  aria-label="Mettre en avant"
                >
                  <Star size={15} className={p.highlight ? "fill-current text-amber-500" : ""} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)} aria-label="Modifier">
                  <Pencil size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Supprimer"
                  onClick={() => {
                    if (window.confirm(`Supprimer l'offre « ${p.name} » ?`))
                      actions.removePlan(p.id);
                  }}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mention sous les tarifs</CardTitle>
          <CardDescription>
            Avertissement affiché sous les offres (indicatif, hors options…).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex justify-end">
            <Button size="sm" onClick={saveNote}>
              <Save size={15} /> Enregistrer la mention
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

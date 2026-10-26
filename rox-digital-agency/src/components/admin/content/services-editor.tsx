import { useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSiteContentAdmin } from "@/hooks/use-site-content";
import { ICON_OPTIONS, iconFor } from "@/lib/service-icons";
import { emptyService, slugify, type Service } from "@/lib/content-store";
import { Field, ListEditor } from "./shared";

export function ServicesEditor() {
  const { content, actions } = useSiteContentAdmin();
  const [draft, setDraft] = useState<Service | null>(null);
  const faqGroups = Object.keys(content.faqs);

  const clone = (s: Service): Service => ({
    ...s,
    page: {
      ...s.page,
      points: [...s.page.points],
      extras: s.page.extras.map((e) => ({ ...e })),
    },
  });

  const openNew = () => setDraft(emptyService());
  const openEdit = (s: Service) => setDraft(clone(s));
  const close = () => setDraft(null);

  const patch = (p: Partial<Service>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const patchPage = (p: Partial<Service["page"]>) =>
    setDraft((d) => (d ? { ...d, page: { ...d.page, ...p } } : d));

  const save = () => {
    if (!draft) return;
    const slug = slugify(draft.slug || draft.name) || `service-${Date.now().toString(36)}`;
    const clean: Service = {
      ...draft,
      slug,
      name: draft.name.trim() || "Service sans titre",
      page: {
        ...draft.page,
        points: draft.page.points.map((p) => p.trim()).filter(Boolean),
        extras: draft.page.extras
          .map((e) => ({ title: e.title.trim(), text: e.text.trim() }))
          .filter((e) => e.title || e.text),
      },
    };
    actions.saveService(clean);
    close();
  };

  if (draft) {
    const Icon = iconFor(draft.icon);
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>
              {content.services.some((s) => s.id === draft.id) ? "Modifier" : "Nouveau service"}
            </CardTitle>
            <CardDescription>
              La carte publique et la page de détail « /services/… ».
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={close}>
            <X size={15} /> Fermer
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basics */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom (carte)">
              <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
            </Field>
            <Field label="Slug (URL)">
              <Input
                value={draft.slug}
                onChange={(e) => patch({ slug: e.target.value })}
                placeholder="seo-local"
              />
            </Field>
            <Field label="Badge (tag)">
              <Input value={draft.tag} onChange={(e) => patch({ tag: e.target.value })} />
            </Field>
            <Field label="Icône">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border">
                  <Icon size={16} className="text-primary" />
                </span>
                <select
                  value={draft.icon}
                  onChange={(e) => patch({ icon: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  {ICON_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
          </div>

          <Field label="Texte de la carte">
            <Textarea
              rows={2}
              value={draft.short}
              onChange={(e) => patch({ short: e.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Groupe FAQ de la page">
              <select
                value={draft.faqKey}
                onChange={(e) => patch({ faqKey: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              >
                {faqGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => patch({ published: e.target.checked })}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Publier sur le site
            </label>
          </div>

          <hr className="border-border" />

          {/* Detail page */}
          <div>
            <p className="text-sm font-semibold text-primary">Page de détail</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Surtitre (eyebrow)">
                <Input
                  value={draft.page.eyebrow}
                  onChange={(e) => patchPage({ eyebrow: e.target.value })}
                />
              </Field>
              <Field label="Titre (H1)">
                <Input
                  value={draft.page.title}
                  onChange={(e) => patchPage({ title: e.target.value })}
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Introduction (lead)">
                <Textarea
                  rows={2}
                  value={draft.page.lead}
                  onChange={(e) => patchPage({ lead: e.target.value })}
                />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Titre de la carte principale">
                <Input
                  value={draft.page.heading}
                  onChange={(e) => patchPage({ heading: e.target.value })}
                />
              </Field>
              <Field label="Sous-titre">
                <Input
                  value={draft.page.subtext}
                  onChange={(e) => patchPage({ subtext: e.target.value })}
                />
              </Field>
            </div>

            <div className="mt-4">
              <ListEditor
                label="Points clés"
                items={draft.page.points}
                onChange={(points) => patchPage({ points })}
                placeholder="Une promesse claire…"
                addLabel="Ajouter un point"
              />
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Encarts latéraux</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    patchPage({ extras: [...draft.page.extras, { title: "", text: "" }] })
                  }
                >
                  <Plus size={14} /> Ajouter un encart
                </Button>
              </div>
              {draft.page.extras.map((ex, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-border p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={ex.title}
                      placeholder="Titre de l'encart"
                      onChange={(e) =>
                        patchPage({
                          extras: draft.page.extras.map((x, j) =>
                            j === i ? { ...x, title: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <Textarea
                      rows={2}
                      value={ex.text}
                      placeholder="Description…"
                      onChange={(e) =>
                        patchPage({
                          extras: draft.page.extras.map((x, j) =>
                            j === i ? { ...x, text: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Retirer l'encart"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      patchPage({ extras: draft.page.extras.filter((_, j) => j !== i) })
                    }
                  >
                    <X size={15} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Libellé de prix">
                <Input
                  value={draft.page.priceLabel}
                  onChange={(e) => patchPage({ priceLabel: e.target.value })}
                />
              </Field>
              <Field label="Montant / valeur">
                <Input
                  value={draft.page.priceValue}
                  onChange={(e) => patchPage({ priceValue: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-2">
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {content.services.length} service{content.services.length > 1 ? "s" : ""} ·{" "}
          {content.services.filter((s) => s.published).length} publié
          {content.services.filter((s) => s.published).length > 1 ? "s" : ""}
        </p>
        <Button onClick={openNew} size="sm">
          <Plus size={15} /> Nouveau service
        </Button>
      </div>

      <div className="space-y-3">
        {content.services.map((s) => {
          const Icon = iconFor(s.icon);
          return (
            <Card key={s.id}>
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                  <Icon size={18} className="text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{s.name || "Sans titre"}</p>
                    <Badge variant={s.published ? "default" : "outline"} className="shrink-0">
                      {s.published ? "Publié" : "Brouillon"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    /services/{s.slug} · {s.tag}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => actions.saveService({ ...s, published: !s.published })}
                    aria-label="Publier / dépublier"
                  >
                    {s.published ? <EyeOff size={15} /> : <Eye size={15} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(s)}
                    aria-label="Modifier"
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Supprimer"
                    onClick={() => {
                      if (window.confirm(`Supprimer le service « ${s.name} » ?`))
                        actions.removeService(s.id);
                    }}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

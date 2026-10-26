import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSiteContentAdmin } from "@/hooks/use-site-content";
import { type FaqItemData } from "@/lib/faq-data";

export function FaqEditor() {
  const { content, actions } = useSiteContentAdmin();
  const groups = Object.keys(content.faqs);
  const [group, setGroup] = useState(groups[0] ?? "general");
  const [items, setItems] = useState<FaqItemData[]>(() =>
    (content.faqs[group] ?? []).map((f) => ({ ...f })),
  );

  const loadGroup = (g: string) => {
    setGroup(g);
    setItems((content.faqs[g] ?? []).map((f) => ({ ...f })));
  };

  const patch = (i: number, p: Partial<FaqItemData>) =>
    setItems((prev) => prev.map((f, j) => (j === i ? { ...f, ...p } : f)));
  const add = () => setItems((prev) => [...prev, { q: "", a: "" }]);
  const remove = (i: number) => setItems((prev) => prev.filter((_, j) => j !== i));

  const save = () =>
    actions.setFaqs(
      group,
      items.map((f) => ({ q: f.q.trim(), a: f.a.trim() })).filter((f) => f.q || f.a),
    );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Groupe de questions</CardTitle>
          <CardDescription>
            Chaque page du site affiche un groupe (« general », « home », « seo », « contact »…).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={group}
            onChange={(e) => loadGroup(e.target.value)}
            className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            aria-label="Choisir un groupe"
          >
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} question{items.length > 1 ? "s" : ""} · groupe « {group} »
        </p>
        <Button onClick={add} size="sm">
          <Plus size={15} /> Ajouter une question
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((f, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-4">
              <Input
                value={f.q}
                placeholder="Question"
                onChange={(e) => patch(i, { q: e.target.value })}
              />
              <div className="flex items-start gap-2">
                <Textarea
                  rows={3}
                  className="flex-1"
                  value={f.a}
                  placeholder="Réponse"
                  onChange={(e) => patch(i, { a: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Retirer la question"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(i)}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={save}>
          <Save size={15} /> Enregistrer le groupe
        </Button>
      </div>
    </div>
  );
}

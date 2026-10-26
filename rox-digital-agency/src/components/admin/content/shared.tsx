import { type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </Label>
  );
}

// Edit a list of plain strings (bullet points, features, cities…).
export function ListEditor({
  label,
  items,
  onChange,
  placeholder,
  addLabel = "Ajouter",
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={it}
            placeholder={placeholder}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Retirer"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <X size={15} />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
        <Plus size={14} /> {addLabel}
      </Button>
    </div>
  );
}

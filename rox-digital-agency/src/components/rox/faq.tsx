import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { JsonLd } from "@/components/rox/json-ld";
import { faqLd } from "@/lib/seo";
import { type FaqItemData } from "@/lib/faq-data";
import { useSiteContent } from "@/hooks/use-site-content";

function FaqItem({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-display text-base font-semibold">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-primary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pr-8 text-sm leading-relaxed text-muted-foreground">{a}</p>
        </div>
      </div>
    </div>
  );
}

// Items resolve from the content store by `group`, so admin edits show up live
// (and feed the FAQPage schema). `items` overrides for one-off lists.
export function Faq({
  group = "general",
  items,
  eyebrow = "FAQ",
  title = "Les questions qu'on nous pose.",
  intro = "Une autre question ? Écrivez-nous via le formulaire de contact, nous répondons en français ou en darija.",
  id = "faq",
  withSchema = true,
}: {
  group?: string;
  items?: FaqItemData[];
  eyebrow?: string;
  title?: string;
  intro?: string;
  id?: string;
  withSchema?: boolean;
}) {
  const content = useSiteContent();
  const resolved = items ?? content.faqs[group] ?? [];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (resolved.length === 0) return null;

  return (
    <section id={id} className="scroll-mt-24 py-20 sm:py-24">
      {withSchema ? <JsonLd data={faqLd(resolved)} /> : null}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              {eyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{title}</h2>
            <p className="mt-4 text-sm text-muted-foreground">{intro}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-6">
            {resolved.map((f, i) => (
              <FaqItem
                key={f.q}
                q={f.q}
                a={f.a}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

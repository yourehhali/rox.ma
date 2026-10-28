import { Check, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useSiteContent } from "@/hooks/use-site-content";

export function Pricing() {
  const content = useSiteContent();
  const plans = content.plans;

  return (
    <section className="pt-12 pb-20 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          {plans.map((p) => (
            <article
              key={p.id}
              className={`relative flex flex-col rounded-xl border p-8 ${
                p.highlight ? "border-primary bg-card" : "border-border bg-card"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Le plus demandé
                </span>
              )}
              <h2 className="font-display text-lg font-semibold">{p.name}</h2>
              <p className="mt-4">
                <span className="font-display text-3xl font-bold text-primary">{p.price}</span>
                <span className="ml-2 text-sm text-muted-foreground">{p.unit}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-3 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="btn-glass-primary mt-8 inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Demander ce service
              </Link>
            </article>
          ))}
        </div>

        {content.info.pricingNote ? (
          <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
            <Info size={15} className="mt-0.5 shrink-0 text-primary" />
            {content.info.pricingNote}
          </p>
        ) : null}
      </div>
    </section>
  );
}

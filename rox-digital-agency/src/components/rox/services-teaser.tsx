import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { iconFor } from "@/lib/service-icons";
import { useSiteContent } from "@/hooks/use-site-content";

export function ServicesTeaser() {
  const content = useSiteContent();
  const items = content.services.filter((s) => s.published);

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Services</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold sm:text-4xl">
              Ce que nous faisons, concrètement.
            </h2>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Voir le détail
            <ArrowRight size={15} />
          </Link>
        </div>

        <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
          {items.map((it) => {
            const Icon = iconFor(it.icon);
            return (
              <li key={it.id} className="bg-card">
                <Link
                  to="/services/$slug"
                  params={{ slug: it.slug }}
                  className="flex h-full flex-col gap-3 p-5 transition-colors hover:bg-background"
                >
                  <Icon size={20} className="text-primary" strokeWidth={1.8} />
                  <span className="text-sm font-medium leading-snug">{it.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { iconFor } from "@/lib/service-icons";
import { useSiteContent } from "@/hooks/use-site-content";
import { Stagger, StaggerItem } from "@/components/rox/motion";

export function Services() {
  const content = useSiteContent();
  const services = content.services.filter((s) => s.published);

  return (
    <section id="services" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Stagger className="mt-0 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const Icon = iconFor(s.icon);
            return (
              <StaggerItem key={s.id} className="h-full [&>article]:h-full">
                <article className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-primary/50">
                  <div className="flex items-start gap-2.5">
                    <Icon size={22} className="mt-0.5 shrink-0 text-primary" strokeWidth={1.8} />
                    <span className="text-[11px] font-semibold uppercase leading-snug tracking-wider text-muted-foreground">
                      {s.tag}
                    </span>
                  </div>
                  <h2 className="mt-5 font-display text-lg font-semibold">{s.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.short}</p>
                  <Link
                    to="/services/$slug"
                    params={{ slug: s.slug }}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    En savoir plus
                    <ArrowRight size={14} />
                  </Link>
                </article>
              </StaggerItem>
            );
          })}

          <StaggerItem className="h-full [&>article]:h-full">
            <article className="flex h-full flex-col justify-between rounded-xl bg-primary p-6 text-primary-foreground">
              <div>
                <h2 className="font-display text-lg font-semibold">Un projet en tête ?</h2>
                <p className="mt-2 text-sm leading-relaxed opacity-90">
                  Décrivez-nous votre besoin : nous revenons vers vous avec un périmètre et un devis
                  clair, sans engagement.
                </p>
              </div>
              <Link
                to="/contact"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
              >
                Démarrer mon projet
                <ArrowUpRight size={15} />
              </Link>
            </article>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}

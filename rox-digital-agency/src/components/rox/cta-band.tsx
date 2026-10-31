import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Reveal } from "@/components/rox/motion";

export function CtaBand() {
  return (
    <section className="border-y border-border bg-card py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal y={24}>
          <div className="rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12 sm:py-16">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold sm:text-4xl">
              Un projet en tête ? Parlons-en.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed opacity-90">
              Décrivez-nous votre besoin : nous revenons vers vous avec un périmètre et un devis
              clair, sans engagement.
            </p>
            <Link
              to="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-background/90"
            >
              Démarrer mon projet
              <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { ListItemVariants, Stagger } from "@/components/rox/motion";

const steps = [
  {
    num: "01",
    title: "Échange & cadrage",
    text: "On discute de votre activité, de vos clients et de vos objectifs. Nous définissons ensemble le périmètre, le budget et le calendrier.",
  },
  {
    num: "02",
    title: "Maquette Figma",
    text: "Vous validez un prototype visuel du site avant tout développement. Des retours à ce stade coûtent moins cher qu'après.",
  },
  {
    num: "03",
    title: "Développement",
    text: "Nous construisons le site, rapides et responsive, avec une base optimisée pour le SEO dès le départ.",
  },
  {
    num: "04",
    title: "Lancement & suivi",
    text: "Mise en ligne accompagnée, hébergement configuré, puis suivi SEO si vous le souhaitez pour continuer à progresser.",
  },
];

export function Process() {
  return (
    <section className="border-y border-border bg-card pt-12 pb-16 sm:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Stagger
          as="ol"
          className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((s) => (
            <motion.li key={s.num} variants={ListItemVariants} className="bg-background p-7">
              <span className="font-display text-3xl font-bold text-primary">{s.num}</span>
              <h2 className="mt-4 font-display text-base font-semibold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </motion.li>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

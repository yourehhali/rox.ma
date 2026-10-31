import { SearchX, EyeOff, PhoneMissed, TrendingDown } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/rox/motion";

const challenges = [
  {
    icon: SearchX,
    title: "Invisible sur Google",
    text: "Vos clients cherchent un produit ou un service près de chez eux. Sans site ni fiche optimisée, c'est votre concurrent qu'ils trouvent.",
  },
  {
    icon: EyeOff,
    title: "Peu crédible en ligne",
    text: "Une entreprise sans site, ou avec un site qui ne s'affiche pas bien sur mobile, donne une mauvaise première impression.",
  },
  {
    icon: PhoneMissed,
    title: "Des demandes perdues",
    text: "Les visiteurs qui ne trouvent pas l'information repartent. Chaque visiteur non converti est un client qui appelle quelqu'un d'autre.",
  },
  {
    icon: TrendingDown,
    title: "Dépendance aux réseaux",
    text: "Publier uniquement sur les réseaux sociaux, c'est dépendre d'un algorithme que vous ne contrôlez pas. Un site vous appartient.",
  },
];

export function Challenges() {
  return (
    <section className="border-y border-border bg-card py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Constat</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold sm:text-4xl">
            Vos clients vous cherchent en ligne. Que trouvent-ils ?
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            La majorité des achats commencent par une recherche sur Google. Si votre entreprise n'y
            est pas visible, la vente se fait ailleurs.
          </p>
        </Reveal>

        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {challenges.map((c) => (
            <StaggerItem key={c.title} className="h-full">
              <article className="flex h-full flex-col rounded-xl border border-border bg-background p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-primary/40">
                <c.icon size={22} className="text-primary" strokeWidth={1.8} />
                <h3 className="mt-4 font-display text-base font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

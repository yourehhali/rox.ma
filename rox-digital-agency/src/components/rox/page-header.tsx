import { Reveal } from "@/components/rox/motion";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-6xl px-4 pt-32 pb-2 sm:px-6 sm:pt-40">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
      <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold sm:text-4xl">{title}</h1>
      {description ? <p className="mt-4 max-w-2xl text-muted-foreground">{description}</p> : null}
    </Reveal>
  );
}

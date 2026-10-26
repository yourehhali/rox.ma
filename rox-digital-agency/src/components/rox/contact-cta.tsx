import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useSiteContent } from "@/hooks/use-site-content";

// The public contact form has no dedicated backend endpoint yet, so we
// compose the message client-side and hand it to the visitor's mail client
// via a `mailto:` URL. The admin's email is read from `SiteInfo.email` so it
// stays updatable from the dashboard without a redeploy. If the admin hasn't
// configured an email yet, we render the onboarding CTA instead of a form
// that would silently drop the message.
export function ContactCta() {
  const { info } = useSiteContent();
  const [submitted, setSubmitted] = useState(false);
  const hasEmail = Boolean(info.email);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasEmail) return;
    const fd = new FormData(e.currentTarget);
    const nom = String(fd.get("nom") ?? "").trim();
    const entreprise = String(fd.get("entreprise") ?? "").trim();
    const contact = String(fd.get("contact") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();
    const subject = encodeURIComponent(`Demande de devis — ${nom || "Nouveau prospect"}`);
    const body = encodeURIComponent(
      [
        `Nom : ${nom}`,
        entreprise ? `Entreprise : ${entreprise}` : null,
        `Contact : ${contact}`,
        "",
        message,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    );
    window.location.href = `mailto:${info.email}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <section className="border-y border-border bg-card pt-32 pb-20 sm:pt-40 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Contact</p>
            <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Parlons de votre projet.
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Décrivez votre activité et ce que vous attendez d'un site web. Nous revenons vers vous
              avec un premier avis et un devis clair, sans engagement.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                Réponse personnalisée, pas de réponse automatique.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                Devis détaillé avant tout début de travail.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                Échange en français ou en darija.
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-background p-6 sm:p-8">
            {!hasEmail ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
                <h2 className="font-display text-lg font-semibold">
                  Démarrer votre projet avec ROX
                </h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Créez votre espace client pour décrire votre besoin, suivre l'avancement de votre
                  commande et échanger directement avec l'équipe.
                </p>
                <Link
                  to="/account"
                  className="btn-glass-primary mt-2 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Créer mon compte
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : submitted ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
                <CheckCircle2 size={40} className="text-primary" strokeWidth={1.5} />
                <h2 className="font-display text-lg font-semibold">
                  Votre logiciel mail est ouvert
                </h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Il ne vous reste plus qu'à cliquer sur <strong>Envoyer</strong>. Si la fenêtre
                  n'est pas apparue, écrivez-nous directement à{" "}
                  <a
                    href={`mailto:${info.email}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {info.email}
                  </a>
                  .
                </p>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Pour un suivi en temps réel de votre commande, créez votre{" "}
                  <Link to="/account" className="text-primary underline-offset-4 hover:underline">
                    espace client
                  </Link>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Modifier ma demande
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Nom
                    <input
                      required
                      name="nom"
                      placeholder="Votre nom"
                      className="rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Entreprise
                    <input
                      name="entreprise"
                      placeholder="Nom de votre activité"
                      className="rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Email ou téléphone
                  <input
                    required
                    name="contact"
                    placeholder="ex. contact@monentreprise.ma"
                    className="rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Votre projet
                  <textarea
                    required
                    name="message"
                    rows={4}
                    placeholder="Votre activité, ce que vous vendez, ce que vous attendez du site…"
                    className="resize-none rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="btn-glass-primary mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Envoyer ma demande
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { VerifyEmailCard } from "@/components/client/verify-email-card";
import { Logo } from "@/components/rox/logo";
import { ThemeToggle } from "@/components/rox/theme-toggle";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Vérification de l'e-mail | ROX Agency" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  // Signup handler stashes the last-used email here so we can seed the field.
  const seedEmail =
    typeof window !== "undefined"
      ? (window as unknown as { __rox_last_email__?: string }).__rox_last_email__
      : undefined;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="h-16 w-16 rounded-xl object-contain" />
          <h1 className="mt-4 font-display text-xl font-bold tracking-tight">
            Vérifiez votre e-mail
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saisissez le code à 6 chiffres envoyé à
            {seedEmail ? (
              <>
                {" "}
                <span className="font-medium text-foreground">{seedEmail}</span>
              </>
            ) : null}
            .
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <VerifyEmailCard initialEmail={seedEmail} onVerified={() => navigate({ to: "/account" })} />
        </div>
      </div>
    </div>
  );
}

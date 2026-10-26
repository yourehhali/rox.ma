import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Logo } from "@/components/rox/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/rox/theme-toggle";

type AuthResult = { ok: boolean; error?: string };

type ClientLoginProps = {
  onLogin: (email: string, password: string) => Promise<AuthResult>;
  onSignup: (name: string, email: string, password: string) => Promise<AuthResult>;
};

export function ClientLogin({ onLogin, onSignup }: ClientLoginProps) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res =
      mode === "login" ? await onLogin(email, password) : await onSignup(name, email, password);
    if (!res.ok) setError(res.error ?? "Une erreur est survenue.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-20 w-20 rounded-xl object-contain" />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Espace client</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Connectez-vous pour suivre vos demandes."
              : "Créez votre compte en quelques secondes."}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`rounded-md py-1.5 transition-colors ${
                mode === "signup" ? "bg-background shadow" : "text-muted-foreground"
              }`}
            >
              Créer un compte
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`rounded-md py-1.5 transition-colors ${
                mode === "login" ? "bg-background shadow" : "text-muted-foreground"
              }`}
            >
              Se connecter
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="client-name">Nom complet</Label>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="client-name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Votre nom"
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="client-email">E-mail</Label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="client-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="vous@exemple.ma"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-password">Mot de passe</Label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="client-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className="px-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full">
              {mode === "login" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Vos informations sont transmises de façon sécurisée à l'équipe ROX.
        </p>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={15} />
            Retour au site public
          </Link>
        </div>
      </div>
    </div>
  );
}

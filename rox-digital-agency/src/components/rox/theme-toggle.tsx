import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition-colors hover:border-primary hover:text-primary ${className}`}
    >
      {/* Render a stable placeholder until mounted to avoid a hydration mismatch. */}
      <span className="contents">
        {mounted ? (
          theme === "dark" ? (
            <Sun size={16} />
          ) : (
            <Moon size={16} />
          )
        ) : (
          <Moon size={16} className="opacity-0" />
        )}
      </span>
    </button>
  );
}

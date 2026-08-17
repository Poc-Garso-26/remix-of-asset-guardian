/**
 * OIDC Callback Route — handles the redirect back from Keycloak after login.
 * Completes the Authorization Code + PKCE exchange and redirects to the dashboard.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getUserManager } from "@/lib/keycloak";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        await getUserManager().signinRedirectCallback();
        if (!cancelled) {
          navigate({ to: "/dashboard", replace: true });
        }
      } catch (err) {
        console.error("[auth/callback] failed to process callback", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha na autenticação");
        }
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-xl font-semibold text-destructive">Erro na autenticação</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => navigate({ to: "/login", replace: true })}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Finalizando autenticação...</p>
      </div>
    </div>
  );
}

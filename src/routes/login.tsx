import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_VERSION_LABEL } from "@/lib/app-version";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — GestãoTI" },
      { name: "description", content: "Acesse o GestãoTI para consultar e gerenciar os ativos de TI da sua organização." },
      { property: "og:title", content: "Entrar — GestãoTI" },
      { property: "og:description", content: "Acesse o GestãoTI para consultar e gerenciar os ativos de TI da sua organização." },
      { property: "og:url", content: "/login" },
      { name: "twitter:title", content: "Entrar — GestãoTI" },
      { name: "twitter:description", content: "Acesse o GestãoTI para consultar e gerenciar os ativos de TI da sua organização." },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  if (!isLoading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  // Auto-redirect to Keycloak on mount if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !redirecting) {
      // Small delay to show the page briefly before redirect
      const timer = setTimeout(() => {
        handleLogin();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, redirecting]);

  async function handleLogin() {
    setError(null);
    setRedirecting(true);
    try {
      await login();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao redirecionar para autenticação");
      setRedirecting(false);
    }
  }

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Pular para conteúdo principal
      </a>
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/15 backdrop-blur">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">GestãoTI</p>
            {/* Sem opacidade: em 11px a opacidade reduzia o contraste abaixo de 4,5:1 (axe/WCAG AA). */}
            <p className="text-[11px] uppercase tracking-widest text-primary-foreground">
              Ativos de TI
            </p>
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <p className="font-display text-5xl leading-[1.05]">
            Inventário completo do seu parque de TI, em um só lugar.
          </p>
          <p className="text-sm text-primary-foreground/80">
            Cadastre, acompanhe e audite computadores, notebooks e impressoras
            com controle de acesso por perfil e relatórios prontos para impressão.
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-primary-foreground/80">
            © {new Date().getFullYear()} GestãoTI · Todos os direitos reservados à Prodabel.
          </p>
          <p className="text-xs text-primary-foreground/80">{APP_VERSION_LABEL}</p>
        </div>
      </div>

      {/* Right panel */}
      <main id="main" tabIndex={-1} className="flex items-center justify-center px-4 py-12 focus:outline-none lg:px-12">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold tracking-tight">GestãoTI</p>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Você será redirecionado para o sistema de autenticação corporativo.
          </p>

          <div className="mt-8 space-y-4">
            {(isLoading || redirecting) && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Verificando sessão..." : "Redirecionando para autenticação..."}
                </p>
              </div>
            )}

            {error && (
              <div role="alert" aria-live="assertive" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            {!isLoading && !redirecting && !isAuthenticated && (
              <button
                type="button"
                onClick={handleLogin}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Entrar com credenciais corporativas
              </button>
            )}
          </div>

          <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Primeiro acesso?</p>
            <p className="mt-1">
              O acesso é gerenciado pelo sistema corporativo de identidade (Keycloak).
              Solicite suas credenciais ao administrador de rede.
            </p>
          </div>

          <p className="mt-6 text-xs text-muted-foreground lg:hidden">{APP_VERSION_LABEL}</p>
        </div>
      </main>
    </div>
  );
}

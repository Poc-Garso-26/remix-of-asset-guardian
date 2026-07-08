import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Boxes, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PasswordInput } from "@/components/ui/password-input";
import { ThemeToggle } from "@/components/theme-toggle";




export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Entrar — GestãoTI" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  


  if (!isLoading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
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
            <p className="text-[11px] uppercase tracking-widest text-primary-foreground/70">
              Ativos de TI
            </p>
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <h2 className="font-display text-5xl leading-[1.05]">
            Inventário completo do seu parque de TI, em um só lugar.
          </h2>
          <p className="text-sm text-primary-foreground/80">
            Cadastre, acompanhe e audite computadores, notebooks e impressoras
            com controle de acesso por perfil e relatórios prontos para impressão.
          </p>
        </div>

        <p className="text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} GestãoTI · Todos os direitos reservados à Prodabel.
        </p>
      </div>

      {/* Right form */}
      <main className="flex items-center justify-center px-4 py-12 lg:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold tracking-tight">GestãoTI</p>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use suas credenciais corporativas para acessar.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-foreground">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-foreground">
                Senha
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 h-auto"
              />
            </div>

            {error && (
              <div role="alert" aria-live="assertive" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </button>

          </form>


          <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Primeiro acesso?</p>
            <p className="mt-1">
              O cadastro de novos usuários é restrito. Solicite a um administrador a
              criação da sua conta em /administracao.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { useAuth, roleLabel } from "@/lib/auth";
import { useCurrentUserStatus } from "@/lib/users-service";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil — GestãoTI" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const { session, logout } = useAuth();
  const { data: status } = useCurrentUserStatus(session?.user.id);
  if (!session) return null;
  const u = session.user;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Conta</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight">Perfil do usuário</h1>
      </header>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
            {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <p className="font-display text-2xl">{u.name}</p>
            <p className="text-sm text-muted-foreground">{u.email}</p>
            <span className="mt-2 inline-flex items-center rounded-full border border-accent bg-accent/40 px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              {roleLabel(u.role)}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Usuário</dt>
            <dd className="mt-1 font-mono text-sm">{u.username}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">ID</dt>
            <dd className="mt-1 font-mono text-sm">{u.id}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Situação</dt>
            <dd className="mt-1">
              {status === "Ativo" ? (
                <span className="inline-flex items-center gap-1 text-xs text-[color:var(--pi-success-text-emphasis)]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                </span>
              ) : status === "Inativo" ? (
                <span className="inline-flex items-center gap-1 text-xs text-[color:var(--pi-danger-text-emphasis)]">
                  <XCircle className="h-3.5 w-3.5" /> Inativo
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-border pt-6">
          <button
            onClick={() => { void logout(); }}
            className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            Encerrar sessão
          </button>
        </div>
      </div>
    </div>
  );
}

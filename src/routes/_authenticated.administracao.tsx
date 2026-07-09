import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Shield, CheckCircle2, XCircle, UserPlus, Loader2, Pencil, Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, roleLabel } from "@/lib/auth";
import { useManagedUsers, type ManagedUser } from "@/lib/users-service";
import { setUserStatus } from "@/lib/users-status.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RegisterUserForm } from "@/components/register-user-form";
import { EditUserRoleDialog } from "@/components/edit-user-role-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/administracao")({
  head: () => ({ meta: [{ title: "Administração — GestãoTI" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { can, session } = useAuth();
  const [quickQ, setQuickQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "gerente" | "usuario">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Ativo" | "Inativo">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [advFilters, setAdvFilters] = useState<{ nome?: string; username?: string; email?: string }>({});
  const queryFilters = {
    q: quickQ || undefined,
    nome: advFilters.nome || undefined,
    username: advFilters.username || undefined,
    email: advFilters.email || undefined,
    role: roleFilter,
    status: statusFilter,
  };
  const { data: users = [], isLoading } = useManagedUsers(queryFilters);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [pendingToggle, setPendingToggle] = useState<ManagedUser | null>(null);
  const queryClient = useQueryClient();
  const setUserStatusFn = useServerFn(setUserStatus);
  const isAdmin = session?.user.role === "admin";
  const statusMutation = useMutation({
    mutationFn: (vars: { userId: string; status: "Ativo" | "Inativo" }) =>
      setUserStatusFn({ data: vars }),
    onSuccess: () => {
      toast.success("Situação do usuário atualizada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg || "Não foi possível atualizar a situação do usuário.");
    },
  });
  if (!can("user.manage")) return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Administração</p>
          <h1 className="mt-1 font-display text-4xl tracking-tight">Usuários & permissões</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os usuários do sistema e seus respectivos perfis de acesso.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Cadastrar usuário
        </Button>
      </header>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados e selecione o perfil de acesso.
            </DialogDescription>
          </DialogHeader>
          <RegisterUserForm
            allowRoleSelection
            onCancel={() => setOpen(false)}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Administradores" value={users.filter((u) => u.role === "admin").length} />
        <Stat label="Gerentes" value={users.filter((u) => u.role === "gerente").length} />
        <Stat label="Usuários" value={users.filter((u) => u.role === "usuario").length} />
      </section>

      {/* Toolbar */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Pesquisa rápida por nome, usuário ou e-mail…"
              value={quickQ}
              onChange={(e) => setQuickQ(e.target.value)}
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <select
            aria-label="Filtrar por perfil"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "gerente" | "usuario")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Todos os perfis</option>
            <option value="admin">Administrador</option>
            <option value="gerente">Gerente</option>
            <option value="usuario">Usuário</option>
          </select>

          <select
            aria-label="Filtrar por situação"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "Ativo" | "Inativo")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Todas as situações</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>

          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium",
              showFilters ? "bg-accent text-accent-foreground" : "bg-card hover:bg-accent",
            )}
          >
            <Filter className="h-4 w-4" /> Filtros avançados
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterInput label="Nome" value={advFilters.nome} onChange={(v) => setAdvFilters((f) => ({ ...f, nome: v }))} />
            <FilterInput label="Usuário" value={advFilters.username} onChange={(v) => setAdvFilters((f) => ({ ...f, username: v }))} />
            <FilterInput label="E-mail" value={advFilters.email} onChange={(v) => setAdvFilters((f) => ({ ...f, email: v }))} />

            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
              <button
                onClick={() => {
                  setAdvFilters({});
                  setQuickQ("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
              >
                <X className="h-4 w-4" /> Limpar filtros
              </button>
              <button
                onClick={() => { /* busca é reativa */ }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Search className="h-4 w-4" /> Pesquisar
              </button>
            </div>
          </div>
        )}
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Usuários</h2>
          <span className="text-xs text-muted-foreground">{users.length} registros</span>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">Usuário</th>
                <th className="px-4 py-3 text-left font-medium">E-mail</th>
                <th className="px-4 py-3 text-left font-medium">Perfil</th>
                <th className="px-4 py-3 text-left font-medium">SITUAÇÃO</th>
                <th className="px-4 py-3 text-left font-medium">Último acesso</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border" aria-busy={isLoading} aria-live="polite">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.username}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full border border-accent bg-accent/40 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const content = u.status === "Ativo" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[color:var(--pi-success-text-emphasis)]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                        </span>
                      ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-[color:var(--pi-danger-text-emphasis)]">
                          <XCircle className="h-3.5 w-3.5" /> Inativo
                        </span>
                      );
                      if (!isAdmin) return content;
                      return (
                        <button
                          type="button"
                          onClick={() => setPendingToggle(u)}
                          disabled={statusMutation.isPending}
                          className="cursor-pointer bg-transparent p-0 border-0 disabled:opacity-60"
                          aria-label={`Alterar situação de ${u.name}`}
                          title="Clique para alternar a situação"
                        >
                          {content}
                        </button>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setEditing(u)}
                      aria-label="Editar perfil"
                      title="Editar perfil"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Modelo RBAC</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              As permissões são derivadas do perfil do usuário recebido da API de
              autenticação. O sistema valida cada ação (visualizar, criar, editar,
              excluir, exportar) com base na matriz definida em <code className="rounded bg-muted px-1 py-0.5 text-xs">src/lib/auth.tsx</code>.
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <li><b className="text-foreground">Administrador</b> — acesso total + gestão</li>
              <li><b className="text-foreground">Gerente</b> — CRUD + relatórios</li>
              <li><b className="text-foreground">Usuário</b> — visualização</li>
            </ul>
          </div>
        </div>
      </section>

      <EditUserRoleDialog
        user={editing}
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
      />

      <ConfirmDialog
        open={!!pendingToggle}
        onOpenChange={(o) => { if (!o) setPendingToggle(null); }}
        title="Deseja alterar a situação deste usuário?"
        description={
          pendingToggle
            ? `${pendingToggle.name} passará para "${pendingToggle.status === "Ativo" ? "Inativo" : "Ativo"}".`
            : ""
        }
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (!pendingToggle) return;
          const next = pendingToggle.status === "Ativo" ? "Inativo" : "Ativo";
          const userId = pendingToggle.user_id;
          setPendingToggle(null);
          statusMutation.mutate({ userId, status: next });
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-foreground">{label}</label>
      <input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
    </div>
  );
}

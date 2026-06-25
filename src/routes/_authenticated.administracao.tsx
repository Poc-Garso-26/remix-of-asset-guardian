import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, CheckCircle2, XCircle, UserPlus, Loader2, Pencil } from "lucide-react";
import { useAuth, roleLabel } from "@/lib/auth";
import { useManagedUsers, type ManagedUser } from "@/lib/users-service";
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

export const Route = createFileRoute("/_authenticated/administracao")({
  head: () => ({ meta: [{ title: "Administração — GestãoTI" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { can } = useAuth();
  const { data: users = [], isLoading } = useManagedUsers();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
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
          Cadastrar usuários
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
                <th className="px-4 py-3 text-left font-medium">Ativo</th>
                <th className="px-4 py-3 text-left font-medium">Último acesso</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
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
                    {u.active ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5" /> Inativo
                      </span>
                    )}
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

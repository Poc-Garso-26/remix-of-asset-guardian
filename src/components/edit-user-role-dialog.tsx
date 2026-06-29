import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuth, roleLabel, type Role } from "@/lib/auth";
import { setUserRole } from "@/lib/users-admin.functions";
import type { ManagedUser } from "@/lib/users-service";

interface Props {
  user: ManagedUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserRoleDialog({ user, open, onOpenChange }: Props) {
  const { session, refresh } = useAuth();
  const qc = useQueryClient();
  const setRole = useServerFn(setUserRole);
  const [selected, setSelected] = useState<Role>(user?.role ?? "usuario");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (user && open) setSelected(user.role);
  }, [user, open]);


  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário inválido.");
      return setRole({ data: { userId: user.user_id, role: selected } });
    },
    onSuccess: async () => {
      toast.success("Perfil atualizado com sucesso.");
      await qc.invalidateQueries({ queryKey: ["managed-users"] });
      if (user && session?.user.id === user.user_id) {
        await refresh();
      }
      onOpenChange(false);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erro ao atualizar perfil.";
      toast.error(message);
    },
  });

  if (!user) return null;

  const isSelf = session?.user.id === user.user_id;
  const isDemotingSelfAdmin = isSelf && user.role === "admin" && selected !== "admin";
  const changed = selected !== user.role;
  const isInactive = user.status === "Inativo";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar perfil de usuário</DialogTitle>
            <DialogDescription>
              Altere o perfil de acesso do usuário. A alteração entra em vigor imediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Perfil atual:{" "}
                <span className="inline-flex items-center rounded-full border border-accent bg-accent/40 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  {roleLabel(user.role)}
                </span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Situação:{" "}
                {user.status === "Ativo" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                    <XCircle className="h-3.5 w-3.5" /> Inativo
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-role">Novo perfil</Label>
              <Select
                value={selected}
                onValueChange={(v) => setSelected(v as Role)}
                disabled={isInactive}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">Usuário Padrão</SelectItem>
                  <SelectItem value="gerente">Gestor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isInactive && (
              <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Não é possível alterar o perfil de um usuário com situação <strong>Inativo</strong>.
                  Reative o usuário na tela de administração antes de alterar o perfil.
                </p>
              </div>
            )}

            {isDemotingSelfAdmin && !isInactive && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Você está alterando seu próprio perfil de Administrador. A operação será bloqueada
                  se você for o último administrador ativo do sistema.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!changed || mutation.isPending || isInactive}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar alteração de perfil"
        description={`Deseja realmente alterar o perfil de ${user.name} de "${roleLabel(user.role)}" para "${roleLabel(selected)}"?`}
        confirmLabel="Confirmar"
        onConfirm={() => {
          setConfirmOpen(false);
          mutation.mutate();
        }}
      />
    </>
  );
}

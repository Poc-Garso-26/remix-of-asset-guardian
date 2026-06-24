import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { createUserAsAdmin } from "@/lib/users-admin.functions";

export interface RegisteredUser {
  username: string;
  email: string;
}

interface RegisterUserFormProps {
  allowRoleSelection: boolean;
  onSuccess?: (user: RegisteredUser) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function RegisterUserForm({
  allowRoleSelection,
  onSuccess,
  onCancel,
  submitLabel = "Cadastrar",
}: RegisterUserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("usuario");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();
  const createUser = useServerFn(createUserAsAdmin);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    if (password !== confirm) {
      setErrors({ confirm: "As senhas não coincidem." });
      return;
    }
    if (password.length < 6) {
      setErrors({ password: "A senha deve ter ao menos 6 caracteres." });
      return;
    }

    setSubmitting(true);
    try {
      if (allowRoleSelection) {
        await createUser({
          data: { name, email, username, password, role },
        });
        toast.success(`Usuário ${username} cadastrado com sucesso.`);
      } else {
        const redirectTo =
          typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: { nome: name, username },
          },
        });
        if (error) throw new Error(error.message);
        toast.success("Cadastro realizado", {
          description: "Se a confirmação de e-mail estiver ativa, verifique sua caixa de entrada.",
        });
      }
      await qc.invalidateQueries({ queryKey: ["managed-users"] });
      onSuccess?.({ username, email });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao cadastrar.";
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="reg-name">Nome completo</Label>
        <Input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-email">E-mail</Label>
        <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-username">Usuário</Label>
        <Input id="reg-username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="reg-password">Senha</Label>
          <PasswordInput id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-confirm">Confirmar senha</Label>
          <PasswordInput id="reg-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
        </div>
      </div>

      {allowRoleSelection && (
        <div className="space-y-1.5">
          <Label htmlFor="reg-role">Perfil</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger id="reg-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usuario">Usuário</SelectItem>
              <SelectItem value="gerente">Gerente</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {errors.form && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {errors.form}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

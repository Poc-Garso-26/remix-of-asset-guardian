/**
 * Server functions para administração de usuários.
 * Requer perfil Administrador.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleEnum = z.enum(["admin", "gerente", "usuario"]);
type RoleEnum = z.infer<typeof roleEnum>;

const ROLE_RANK: Record<RoleEnum, number> = { admin: 3, gerente: 2, usuario: 1 };

async function ensureAdmin(
  supabase: {
    rpc: (
      fn: "has_role",
      args: { _user_id: string; _role: "admin" },
    ) => Promise<{ data: unknown; error: unknown }>;
  },
  userId: string,
) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error("Falha ao validar permissão.");
  if (!data) throw new Error("Acesso negado: requer Administrador.");
}

export const createUserAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
        email: z.string().email(),
        username: z.string().min(2).max(60),
        password: z.string().min(6).max(72),
        role: roleEnum,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { nome: data.name, username: data.username },
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? "Falha ao criar usuário.");
    }
    const newUserId = created.data.user.id;

    if (data.role !== "usuario") {
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role: data.role });
    }
    return { ok: true, userId: newUserId };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), role: roleEnum }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Bloquear alteração de perfil de usuários inativos
    const { data: targetProfile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("status, active")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (profErr) throw new Error("Falha ao consultar situação do usuário.");
    const rawStatus = (targetProfile as { status?: string } | null)?.status;
    const isInactive =
      rawStatus === "Inativo" ||
      (rawStatus !== "Ativo" && (targetProfile as { active?: boolean } | null)?.active === false);
    if (isInactive) {
      throw new Error("Não é possível alterar o perfil de um usuário inativo.");
    }
    const { data: existingRoles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if (rolesErr) throw new Error("Falha ao consultar perfis atuais.");

    let previousRole: RoleEnum = "usuario";
    for (const r of existingRoles ?? []) {
      const role = r.role as RoleEnum;
      if (ROLE_RANK[role] > ROLE_RANK[previousRole]) previousRole = role;
    }

    if (previousRole === data.role) {
      return { ok: true, previousRole, newRole: data.role, unchanged: true };
    }

    // Protect last active admin
    if (previousRole === "admin" && data.role !== "admin") {
      const { data: count, error: countErr } = await supabaseAdmin.rpc("count_active_admins");
      if (countErr) throw new Error("Falha ao validar administradores ativos.");
      if ((count as number) <= 1) {
        throw new Error(
          "Não é possível remover o perfil de Administrador do último administrador ativo do sistema.",
        );
      }
    }

    // Replace role rows
    const { error: delErr } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (delErr) throw new Error("Falha ao atualizar perfil.");

    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (insErr) throw new Error("Falha ao atribuir novo perfil.");

    // Audit log
    const { error: auditErr } = await supabaseAdmin.from("role_audit_log").insert({
      target_user_id: data.userId,
      previous_role: previousRole,
      new_role: data.role,
      changed_by: context.userId,
    });
    if (auditErr) console.error("[role-audit] failed to record audit entry", auditErr);

    return { ok: true, previousRole, newRole: data.role };
  });

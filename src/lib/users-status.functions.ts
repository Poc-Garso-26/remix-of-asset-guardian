/**
 * Server function para alternar a situação (Ativo/Inativo) de um usuário.
 * Apenas administradores podem executar.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const statusEnum = z.enum(["Ativo", "Inativo"]);

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), status: statusEnum }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error("Falha ao validar permissão.");
    if (!isAdmin) throw new Error("Acesso negado: requer Administrador.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Proteção: impedir inativar o último administrador ativo
    if (data.status === "Inativo") {
      const { data: targetRoles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", data.userId);
      const targetIsAdmin = (targetRoles ?? []).some((r) => r.role === "admin");
      if (targetIsAdmin) {
        const { data: count, error: countErr } = await supabaseAdmin.rpc("count_active_admins");
        if (countErr) throw new Error("Falha ao validar administradores ativos.");
        if ((count as number) <= 1) {
          throw new Error(
            "Não é possível inativar o último administrador ativo do sistema.",
          );
        }
      }
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: data.status })
      .eq("user_id", data.userId);
    if (error) throw new Error("Não foi possível atualizar a situação do usuário.");

    return { ok: true, status: data.status };
  });

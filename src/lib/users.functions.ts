import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireKeycloakAuth } from "@/integrations/keycloak/auth-middleware";
import { highestRole, requirePermission, type Role } from "./authorization";
import type { ManagedUser, ManagedUsersFilters, UserStatus } from "./users-service";

const filtersSchema = z.object({
  q: z.string().max(200).optional(),
  nome: z.string().max(120).optional(),
  username: z.string().max(120).optional(),
  email: z.string().max(254).optional(),
  role: z.union([z.literal("all"), z.enum(["admin", "gerente", "usuario"])]).optional(),
  status: z.union([z.literal("all"), z.enum(["Ativo", "Inativo"])]).optional(),
});

function escapeIlike(value: string): string {
  return value.replace(/([,()])/g, "\\$1");
}

function mapStatus(profile: { status?: string | null; active?: boolean | null }): UserStatus {
  if (profile.status === "Ativo" || profile.status === "Inativo") return profile.status;
  return profile.active === false ? "Inativo" : "Ativo";
}

async function getDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const listManagedUsersFn = createServerFn({ method: "POST" })
  .middleware([requireKeycloakAuth])
  .validator((input: unknown) => filtersSchema.parse(input ?? {}))
  .handler(async ({ data: filters, context }) => {
    requirePermission(context.roles, "user.manage");
    const db = await getDb();
    let query = db
      .from("profiles")
      .select("id, user_id, nome, email, username, active, status, last_login, created_at")
      .order("created_at", { ascending: false });

    if (filters.nome?.trim()) query = query.ilike("nome", `%${filters.nome.trim()}%`);
    if (filters.username?.trim()) query = query.ilike("username", `%${filters.username.trim()}%`);
    if (filters.email?.trim()) query = query.ilike("email", `%${filters.email.trim()}%`);
    if (filters.q?.trim()) {
      const search = escapeIlike(filters.q.trim());
      query = query.or(`nome.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);

    const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] =
      await Promise.all([query, db.from("user_roles").select("user_id, role")]);
    if (profilesError) throw new Error(profilesError.message);
    if (rolesError) throw new Error(rolesError.message);

    const roleByUser = new Map<string, Role>();
    const rank: Record<Role, number> = { admin: 3, gerente: 2, usuario: 1 };
    for (const row of roles ?? []) {
      const role = row.role as Role;
      const current = roleByUser.get(row.user_id);
      if (!current || rank[role] > rank[current]) roleByUser.set(row.user_id, role);
    }

    const users: ManagedUser[] = (profiles ?? []).map((profile) => {
      const status = mapStatus(profile);
      return {
        id: profile.id,
        user_id: profile.user_id,
        name: profile.nome,
        email: profile.email,
        username: profile.username ?? "",
        role: roleByUser.get(profile.user_id) ?? "usuario",
        active: status === "Ativo",
        status,
        lastLogin: profile.last_login ?? profile.created_at,
      };
    });

    return filters.role && filters.role !== "all"
      ? users.filter((user) => user.role === filters.role)
      : users;
  });

export const getCurrentUserStatusFn = createServerFn({ method: "GET" })
  .middleware([requireKeycloakAuth])
  .handler(async ({ context }) => {
    if (!highestRole(context.roles)) {
      throw new Error("Acesso negado: nenhuma role reconhecida.");
    }
    const db = await getDb();
    let profile: { status?: string | null; active?: boolean | null } | null = null;

    if (context.email) {
      const byEmail = await db
        .from("profiles")
        .select("status, active")
        .eq("email", context.email)
        .maybeSingle();
      if (byEmail.error) throw new Error(byEmail.error.message);
      profile = byEmail.data;
    }

    if (!profile && z.string().uuid().safeParse(context.userId).success) {
      const byId = await db
        .from("profiles")
        .select("status, active")
        .eq("user_id", context.userId)
        .maybeSingle();
      if (byId.error) throw new Error(byId.error.message);
      profile = byId.data;
    }

    return profile ? mapStatus(profile) : null;
  });

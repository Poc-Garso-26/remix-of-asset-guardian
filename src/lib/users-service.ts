/**
 * Camada de gestão de usuários — Supabase.
 * Lista profiles + roles (visível para admins via RLS).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "./auth";

export type UserStatus = "Ativo" | "Inativo";

export interface ManagedUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  active: boolean;
  status: UserStatus;
  lastLogin: string;
}

export interface ManagedUsersFilters {
  q?: string;
  nome?: string;
  username?: string;
  email?: string;
  role?: "all" | Role;
  status?: "all" | UserStatus;
}

function escapeIlike(value: string): string {
  // Escape commas/parens that would break PostgREST .or() syntax.
  return value.replace(/([,()])/g, "\\$1");
}

export async function listManagedUsers(filters: ManagedUsersFilters = {}): Promise<ManagedUser[]> {
  let query = supabase
    .from("profiles")
    .select("id, user_id, nome, email, username, active, status, last_login, created_at")
    .order("created_at", { ascending: false });

  if (filters.nome?.trim()) query = query.ilike("nome", `%${filters.nome.trim()}%`);
  if (filters.username?.trim()) query = query.ilike("username", `%${filters.username.trim()}%`);
  if (filters.email?.trim()) query = query.ilike("email", `%${filters.email.trim()}%`);
  if (filters.q?.trim()) {
    const q = escapeIlike(filters.q.trim());
    query = query.or(`nome.ilike.%${q}%,username.ilike.%${q}%,email.ilike.%${q}%`);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
    query,
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (pErr) throw pErr;
  if (rErr) throw rErr;

  const roleByUser = new Map<string, Role>();
  for (const r of roles ?? []) {
    const role = r.role as Role;
    const current = roleByUser.get(r.user_id);
    const rank: Record<Role, number> = { admin: 3, gerente: 2, usuario: 1 };
    if (!current || rank[role] > rank[current]) roleByUser.set(r.user_id, role);
  }

  const mapped = (profiles ?? []).map((p) => {
    const active = p.active ?? true;
    const rawStatus = (p as { status?: string }).status;
    const status: UserStatus =
      rawStatus === "Inativo" || rawStatus === "Ativo"
        ? (rawStatus as UserStatus)
        : active
          ? "Ativo"
          : "Inativo";
    return {
      id: p.id,
      user_id: p.user_id,
      name: p.nome,
      email: p.email,
      username: p.username ?? "",
      role: roleByUser.get(p.user_id) ?? "usuario",
      active,
      status,
      lastLogin: p.last_login ?? p.created_at,
    };
  });

  if (filters.role && filters.role !== "all") {
    return mapped.filter((u) => u.role === filters.role);
  }
  return mapped;
}

export function useManagedUsers(filters: ManagedUsersFilters = {}) {
  return useQuery({
    queryKey: ["managed-users", filters],
    queryFn: () => listManagedUsers(filters),
  });
}

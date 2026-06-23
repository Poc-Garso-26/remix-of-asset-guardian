/**
 * Camada de gestão de usuários — Supabase.
 * Lista profiles + roles (visível para admins via RLS).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "./auth";

export interface ManagedUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  active: boolean;
  lastLogin: string;
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, user_id, nome, email, username, active, last_login, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (pErr) throw pErr;
  if (rErr) throw rErr;

  const roleByUser = new Map<string, Role>();
  for (const r of roles ?? []) {
    const role = r.role as Role;
    const current = roleByUser.get(r.user_id);
    // Hierarchy: admin > gerente > usuario
    const rank: Record<Role, number> = { admin: 3, gerente: 2, usuario: 1 };
    if (!current || rank[role] > rank[current]) roleByUser.set(r.user_id, role);
  }

  return (profiles ?? []).map((p) => ({
    id: p.id,
    user_id: p.user_id,
    name: p.nome,
    email: p.email,
    username: p.username ?? "",
    role: roleByUser.get(p.user_id) ?? "usuario",
    active: p.active ?? true,
    lastLogin: p.last_login ?? p.created_at,
  }));
}

export function useManagedUsers() {
  return useQuery({ queryKey: ["managed-users"], queryFn: listManagedUsers });
}

/**
 * Camada de autenticação — integrada ao Supabase Auth.
 * Carrega sessão + profile + role do usuário e expõe `useAuth()`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type Role = "admin" | "gerente" | "usuario";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthSession>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export type Permission =
  | "asset.view"
  | "asset.create"
  | "asset.edit"
  | "asset.delete"
  | "report.view"
  | "report.export"
  | "user.manage"
  | "role.manage"
  | "settings.manage";

const PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "asset.view",
    "asset.create",
    "asset.edit",
    "asset.delete",
    "report.view",
    "report.export",
    "user.manage",
    "role.manage",
    "settings.manage",
  ],
  gerente: [
    "asset.view",
    "asset.create",
    "asset.edit",
    "report.view",
    "report.export",
  ],
  usuario: ["asset.view"],
};

export function roleLabel(role: Role): string {
  return role === "admin" ? "Administrador" : role === "gerente" ? "Gerente" : "Usuário";
}

async function loadUser(sbSession: Session): Promise<AuthSession> {
  const uid = sbSession.user.id;
  const [{ data: profile }, { data: rolesRows }] = await Promise.all([
    supabase.from("profiles").select("nome, username, email").eq("user_id", uid).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", uid),
  ]);

  const roles = (rolesRows ?? []).map((r) => r.role as Role);
  const role: Role = roles.includes("admin")
    ? "admin"
    : roles.includes("gerente")
      ? "gerente"
      : "usuario";

  const email = sbSession.user.email ?? profile?.email ?? "";
  return {
    token: sbSession.access_token,
    user: {
      id: uid,
      email,
      name: profile?.nome ?? email.split("@")[0] ?? "Usuário",
      username: profile?.username ?? email.split("@")[0] ?? "",
      role,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrate = useCallback(async (sbSession: Session | null) => {
    if (!sbSession) {
      setSession(null);
      return;
    }
    try {
      const next = await loadUser(sbSession);
      setSession(next);
    } catch (err) {
      console.error("[auth] failed to load user", err);
      setSession(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sbSession) => {
      if (!mounted) return;
      // Defer Supabase calls out of the callback synchronously
      setTimeout(() => {
        void hydrate(sbSession);
      }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      void hydrate(data.session).finally(() => {
        if (mounted) setIsLoading(false);
      });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string): Promise<AuthSession> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("Sessão indisponível. Verifique seu e-mail.");
    const next = await loadUser(data.session);
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await hydrate(data.session);
  }, [hydrate]);

  const can = useCallback(
    (permission: Permission) => {
      if (!session) return false;
      return PERMISSIONS[session.user.role].includes(permission);
    },
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session,
      isLoading,
      login,
      logout,
      can,
      refresh,
    }),
    [session, isLoading, login, logout, can, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}

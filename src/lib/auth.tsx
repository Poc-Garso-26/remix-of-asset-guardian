/**
 * Camada de autenticação — integrada ao Keycloak via OIDC.
 * Carrega sessão do Keycloak, extrai roles do token JWT e expõe `useAuth()`.
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
import type { User } from "oidc-client-ts";
import { extractRolesFromToken, decodeTokenPayload, getUserManager } from "./keycloak";
import {
  PERMISSIONS,
  highestRole,
  type Permission,
  type Role,
} from "./authorization";

export type { Permission, Role } from "./authorization";

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
  login: () => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function roleLabel(role: Role): string {
  return role === "admin" ? "Administrador" : role === "gerente" ? "Gerente" : "Usuário";
}

/**
 * Build an AuthSession from the oidc-client-ts User object.
 */
function buildSession(oidcUser: User): AuthSession {
  const accessToken = oidcUser.access_token;
  const roles = extractRolesFromToken(accessToken);
  const role = highestRole(roles) ?? "usuario";

  const payload = decodeTokenPayload(accessToken);
  const idPayload = oidcUser.id_token ? decodeTokenPayload(oidcUser.id_token) : payload;

  const sub = (payload.sub as string) ?? "";
  const email = (idPayload.email as string) ?? (payload.email as string) ?? "";
  const name =
    (idPayload.name as string) ??
    (payload.name as string) ??
    (idPayload.preferred_username as string) ??
    email.split("@")[0] ??
    "Usuário";
  const username =
    (idPayload.preferred_username as string) ??
    (payload.preferred_username as string) ??
    email.split("@")[0] ??
    "";

  return {
    token: accessToken,
    user: {
      id: sub,
      email,
      name,
      username,
      role,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing session on mount
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const oidcUser = await getUserManager().getUser();
        if (oidcUser && !oidcUser.expired) {
          if (mounted) setSession(buildSession(oidcUser));
        } else {
          if (mounted) setSession(null);
        }
      } catch (err) {
        console.error("[auth] failed to load session", err);
        if (mounted) setSession(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadSession();

    // Listen for token renewal events
    const onUserLoaded = (user: User) => {
      if (mounted) setSession(buildSession(user));
    };
    const onUserUnloaded = () => {
      if (mounted) setSession(null);
    };
    const onSilentRenewError = (err: Error) => {
      console.error("[auth] silent renew failed", err);
    };

    const mgr = getUserManager();
    mgr.events.addUserLoaded(onUserLoaded);
    mgr.events.addUserUnloaded(onUserUnloaded);
    mgr.events.addSilentRenewError(onSilentRenewError);

    return () => {
      mounted = false;
      mgr.events.removeUserLoaded(onUserLoaded);
      mgr.events.removeUserUnloaded(onUserUnloaded);
      mgr.events.removeSilentRenewError(onSilentRenewError);
    };
  }, []);

  const login = useCallback(async () => {
    await getUserManager().signinRedirect();
  }, []);

  const logout = useCallback(async () => {
    setSession(null);
    await getUserManager().signoutRedirect();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const user = await getUserManager().signinSilent();
      if (user) setSession(buildSession(user));
    } catch (err) {
      console.error("[auth] refresh failed", err);
      setSession(null);
    }
  }, []);

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

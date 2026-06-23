/**
 * Camada de autenticação.
 *
 * IMPORTANTE: Esta é uma implementação MOCK que simula uma API externa de autenticação.
 * Para integrar com a API real, substitua a função `mockLoginRequest` por uma chamada
 * `fetch(AUTH_API_URL + "/login", ...)` que retorne `{ token, user: { ..., role } }`.
 *
 * Toda a aplicação consome esta camada via `useAuth()`, então a troca é isolada.
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
  login: (username: string, password: string) => Promise<AuthSession>;
  logout: () => void;
  can: (permission: Permission) => boolean;
}

const STORAGE_KEY = "gti.session.v1";

const AuthContext = createContext<AuthContextValue | null>(null);

// --- Permissões (RBAC) ---
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

// --- Mock da API externa ---
import { findUserByCredentials } from "./users-mock";

async function mockLoginRequest(username: string, password: string): Promise<AuthSession> {
  // Simula latência de rede
  await new Promise((r) => setTimeout(r, 600));
  const match = findUserByCredentials(username, password);
  if (!match) {
    throw new Error("Usuário ou senha inválidos.");
  }
  const user: AuthUser = {
    id: match.id,
    username: match.username,
    name: match.name,
    email: match.email,
    role: match.role,
  };
  const token = `mock.${btoa(match.id)}.${Date.now()}`;
  return { token, user };
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setSession(JSON.parse(raw));
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const next = await mockLoginRequest(username, password);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
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
    }),
    [session, isLoading, login, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession).token : null;
  } catch {
    return null;
  }
}

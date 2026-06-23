/**
 * Store local (localStorage) de usuários gerenciados.
 * Compartilhada entre a tela de Administração e o mock de autenticação.
 */
import { useSyncExternalStore } from "react";
import type { Role } from "./auth";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string;
  role: Role;
  active: boolean;
  lastLogin: string; // ISO
}

const STORAGE_KEY = "gti.users.v1";

const SEED: ManagedUser[] = [
  {
    id: "u-1",
    name: "Ana Silva",
    email: "ana.silva@empresa.com",
    username: "admin",
    password: "admin123",
    role: "admin",
    active: true,
    lastLogin: new Date(Date.now() - 1 * 3600_000).toISOString(),
  },
  {
    id: "u-2",
    name: "Bruno Costa",
    email: "bruno.costa@empresa.com",
    username: "gerente",
    password: "gerente123",
    role: "gerente",
    active: true,
    lastLogin: new Date(Date.now() - 26 * 3600_000).toISOString(),
  },
  {
    id: "u-3",
    name: "Carla Mendes",
    email: "carla.mendes@empresa.com",
    username: "usuario",
    password: "usuario123",
    role: "usuario",
    active: true,
    lastLogin: new Date(Date.now() - 5 * 86400_000).toISOString(),
  },
  {
    id: "u-4",
    name: "Diego Rocha",
    email: "diego.rocha@empresa.com",
    username: "drocha",
    password: "drocha123",
    role: "usuario",
    active: false,
    lastLogin: new Date(Date.now() - 60 * 86400_000).toISOString(),
  },
];

function load(): ManagedUser[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return SEED.slice();
    }
    return JSON.parse(raw) as ManagedUser[];
  } catch {
    return SEED.slice();
  }
}

let users: ManagedUser[] = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function listUsers(): ManagedUser[] {
  return users;
}

export function findUserByCredentials(username: string, password: string): ManagedUser | undefined {
  const u = username.trim().toLowerCase();
  return users.find(
    (x) => x.active && x.username.toLowerCase() === u && x.password === password,
  );
}

export interface CreateUserInput {
  name: string;
  email: string;
  username: string;
  password: string;
  role: Role;
}

export interface ValidationError {
  field: keyof CreateUserInput | "form";
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9._-]+$/;

export function validateUser(input: CreateUserInput): ValidationError | null {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();

  if (name.length < 3 || name.length > 80)
    return { field: "name", message: "Nome deve ter entre 3 e 80 caracteres." };
  if (!EMAIL_RE.test(email))
    return { field: "email", message: "E-mail inválido." };
  if (username.length < 3 || username.length > 30)
    return { field: "username", message: "Usuário deve ter entre 3 e 30 caracteres." };
  if (!USERNAME_RE.test(username))
    return { field: "username", message: "Use apenas letras minúsculas, números, ponto, hífen ou underscore." };
  if (input.password.length < 6)
    return { field: "password", message: "Senha deve ter ao menos 6 caracteres." };
  if (users.some((u) => u.username.toLowerCase() === username))
    return { field: "username", message: "Este nome de usuário já está em uso." };
  if (users.some((u) => u.email.toLowerCase() === email))
    return { field: "email", message: "Este e-mail já está em uso." };
  return null;
}

export function createUser(input: CreateUserInput): ManagedUser {
  const err = validateUser(input);
  if (err) throw Object.assign(new Error(err.message), { field: err.field });
  const user: ManagedUser = {
    id: `u-${Date.now().toString(36)}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    username: input.username.trim().toLowerCase(),
    password: input.password,
    role: input.role,
    active: true,
    lastLogin: new Date().toISOString(),
  };
  users = [...users, user];
  persist();
  return user;
}

export function useManagedUsers(): ManagedUser[] {
  return useSyncExternalStore(
    subscribe,
    () => users,
    () => SEED,
  );
}

/** @deprecated mantido para compatibilidade; use `useManagedUsers()` ou `listUsers()`. */
export const MOCK_MANAGED_USERS = users;

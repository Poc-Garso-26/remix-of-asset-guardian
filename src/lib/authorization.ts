export type Role = "admin" | "gerente" | "usuario";

export type Permission =
  | "asset.view"
  | "asset.create"
  | "asset.edit"
  | "asset.delete"
  | "report.view"
  | "report.export";

export const PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  admin: [
    "asset.view",
    "asset.create",
    "asset.edit",
    "asset.delete",
    "report.view",
    "report.export",
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

const ROLE_RANK: Readonly<Record<Role, number>> = {
  admin: 3,
  gerente: 2,
  usuario: 1,
};

export function normalizeRoles(roles: readonly string[]): Role[] {
  return Array.from(
    new Set(
      roles
        .map((role) => role.toLowerCase())
        .filter((role): role is Role => role in ROLE_RANK),
    ),
  );
}

export function highestRole(roles: readonly string[]): Role | null {
  return normalizeRoles(roles).sort((a, b) => ROLE_RANK[b] - ROLE_RANK[a])[0] ?? null;
}

export function hasPermission(roles: readonly string[], permission: Permission): boolean {
  const role = highestRole(roles);
  return role !== null && PERMISSIONS[role].includes(permission);
}

export function requirePermission(roles: readonly string[], permission: Permission): Role {
  const role = highestRole(roles);
  if (!role || !PERMISSIONS[role].includes(permission)) {
    throw new Error(`Acesso negado: permissão ${permission} necessária.`);
  }
  return role;
}

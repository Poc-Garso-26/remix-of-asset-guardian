import { useQuery } from "@tanstack/react-query";
import type { Role } from "./authorization";
import { getCurrentUserStatusFn, listManagedUsersFn } from "./users.functions";

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

export function listManagedUsers(filters: ManagedUsersFilters = {}): Promise<ManagedUser[]> {
  return listManagedUsersFn({ data: filters });
}

export function useManagedUsers(filters: ManagedUsersFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ["managed-users", filters],
    queryFn: () => listManagedUsers(filters),
    enabled,
  });
}

export function getUserStatus(_userId: string): Promise<UserStatus | null> {
  return getCurrentUserStatusFn();
}

export function useCurrentUserStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile-status", userId],
    queryFn: () => getUserStatus(userId!),
    enabled: !!userId,
  });
}

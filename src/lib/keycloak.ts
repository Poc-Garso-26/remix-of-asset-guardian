/**
 * Keycloak OIDC client configuration using oidc-client-ts.
 * This module initializes and exports the UserManager singleton used
 * throughout the app for login, logout, token refresh and session management.
 *
 * NOTE: UserManager requires browser APIs (window, sessionStorage).
 * It is lazily initialized to avoid SSR errors.
 */
import { UserManager, WebStorageStateStore, type UserManagerSettings } from "oidc-client-ts";

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL ?? "";
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM ?? "";
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "";
const REDIRECT_URI = import.meta.env.VITE_KEYCLOAK_REDIRECT_URI ?? "";
const POST_LOGOUT_REDIRECT_URI = import.meta.env.VITE_KEYCLOAK_POST_LOGOUT_REDIRECT_URI ?? "";

/** Base URL for the Keycloak realm's OIDC endpoints */
const authority = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;

let _userManager: UserManager | undefined;

/**
 * Lazily creates the UserManager singleton (browser-only).
 * Throws if called on the server.
 */
export function getUserManager(): UserManager {
  if (_userManager) return _userManager;

  if (typeof window === "undefined") {
    throw new Error("UserManager can only be used in the browser.");
  }

  if (!KEYCLOAK_URL || !KEYCLOAK_REALM || !KEYCLOAK_CLIENT_ID) {
    throw new Error(
      "VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, and VITE_KEYCLOAK_CLIENT_ID must be defined in .env",
    );
  }

  const settings: UserManagerSettings = {
    authority,
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: REDIRECT_URI || `${window.location.origin}/auth/callback`,
    post_logout_redirect_uri: POST_LOGOUT_REDIRECT_URI || `${window.location.origin}/login`,
    response_type: "code",
    scope: "openid profile email",
    automaticSilentRenew: true,
    silentRequestTimeoutInSeconds: 30,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  };

  _userManager = new UserManager(settings);
  return _userManager;
}

/** Convenience alias — same as getUserManager() */
export const userManager = new Proxy({} as UserManager, {
  get(_, prop, receiver) {
    const mgr = getUserManager();
    const value = Reflect.get(mgr, prop, receiver);
    return typeof value === "function" ? value.bind(mgr) : value;
  },
});

/**
 * Extract app roles from a Keycloak access token.
 * Keycloak encodes resource roles in the JWT claim:
 *   resource_access.<client_id>.roles: string[]
 */
export function extractRolesFromToken(accessToken: string): string[] {
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    const clientId = KEYCLOAK_CLIENT_ID;
    const clientRoles = payload?.resource_access?.[clientId]?.roles;
    if (Array.isArray(clientRoles)) return clientRoles;
    // Fallback: check realm_access.roles
    const realmRoles = payload?.realm_access?.roles;
    if (Array.isArray(realmRoles)) return realmRoles;
    return [];
  } catch {
    return [];
  }
}

/**
 * Decode basic user info from the ID token or access token payload.
 */
export function decodeTokenPayload(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

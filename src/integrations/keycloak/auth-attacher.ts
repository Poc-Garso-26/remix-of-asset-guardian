/**
 * Client-side middleware for TanStack Start server functions.
 * Attaches the Keycloak access token as a Bearer Authorization header
 * to every RPC call made to server functions.
 */
import { createMiddleware } from "@tanstack/react-start";

export const attachKeycloakAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | undefined;
    if (typeof window !== "undefined") {
      const { getUserManager } = await import("@/lib/keycloak");
      try {
        const mgr = getUserManager();
        const user = await mgr.getUser();
        token = user?.access_token;
        if (!token) {
          console.warn("[auth-attacher] No access token found in session. User may not be logged in.");
        }
      } catch (err) {
        console.warn("[auth-attacher] Failed to get user from UserManager:", err);
      }
    }
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);

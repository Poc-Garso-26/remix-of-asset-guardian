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
      } catch {
        // UserManager not available — skip token
      }
    }
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);

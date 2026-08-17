/**
 * Server-side middleware for TanStack Start server functions.
 * Validates the Keycloak JWT from the Authorization header using
 * the Keycloak realm's JWKS endpoint and extracts user identity + roles.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

const KEYCLOAK_URL = process.env.VITE_KEYCLOAK_URL ?? process.env.KEYCLOAK_URL;
const KEYCLOAK_REALM = process.env.VITE_KEYCLOAK_REALM ?? process.env.KEYCLOAK_REALM;
const KEYCLOAK_CLIENT_ID = process.env.VITE_KEYCLOAK_CLIENT_ID ?? process.env.KEYCLOAK_CLIENT_ID;

let _jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJWKS() {
  if (!_jwks) {
    if (!KEYCLOAK_URL || !KEYCLOAK_REALM) {
      throw new Error(
        "Missing KEYCLOAK_URL or KEYCLOAK_REALM environment variable for JWT verification.",
      );
    }
    const jwksUri = new URL(
      `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
    );
    _jwks = createRemoteJWKSet(jwksUri);
  }
  return _jwks;
}

export interface KeycloakAuthContext {
  userId: string;
  email: string;
  username: string;
  roles: string[];
  claims: Record<string, unknown>;
}

export const requireKeycloakAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized: No Bearer token provided");
    }

    const token = authHeader.slice(7);
    if (!token || token.split(".").length !== 3) {
      throw new Error("Unauthorized: Invalid token format");
    }

    const jwks = getJWKS();

    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
      });

      if (KEYCLOAK_CLIENT_ID) {
        const audiences = Array.isArray(payload.aud)
          ? payload.aud
          : payload.aud
            ? [payload.aud]
            : [];
        const authorizedParty = payload.azp;
        if (!audiences.includes(KEYCLOAK_CLIENT_ID) && authorizedParty !== KEYCLOAK_CLIENT_ID) {
          throw new Error("Token was not issued for this application");
        }
      }

      const userId = payload.sub;
      if (!userId) {
        throw new Error("Unauthorized: No user ID found in token");
      }

      // Extract roles from resource_access.<client_id>.roles or realm_access.roles
      let roles: string[] = [];
      if (KEYCLOAK_CLIENT_ID) {
        const resourceAccess = payload.resource_access as
          | Record<string, { roles?: string[] }>
          | undefined;
        roles = resourceAccess?.[KEYCLOAK_CLIENT_ID]?.roles ?? [];
      }
      if (roles.length === 0) {
        const realmAccess = payload.realm_access as { roles?: string[] } | undefined;
        roles = realmAccess?.roles ?? [];
      }

      const email = (payload.email as string) ?? "";
      const username = (payload.preferred_username as string) ?? "";

      return next({
        context: {
          userId,
          email,
          username,
          roles,
          claims: payload as Record<string, unknown>,
        } satisfies KeycloakAuthContext,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Token validation failed";
      throw new Error(`Unauthorized: ${message}`);
    }
  },
);

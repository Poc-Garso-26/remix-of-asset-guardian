import { createMiddleware, createStart } from "@tanstack/react-start";

import { attachKeycloakAuth } from "@/integrations/keycloak/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error("[server-fn error]", error);
    throw error;
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachKeycloakAuth],
  requestMiddleware: [errorMiddleware],
}));

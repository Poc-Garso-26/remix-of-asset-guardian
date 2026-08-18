import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachKeycloakAuth } from "@/integrations/keycloak/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error("[server-fn error]", error);
    // Re-throw so TanStack Start forwards the error message to the client
    throw error;
  }
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachKeycloakAuth],
  requestMiddleware: [errorMiddleware],
  serverFns: {
    disableCsrfMiddlewareWarning: true,
  },
}));

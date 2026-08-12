import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { config as configureZod } from "zod";

import { routeTree } from "./routeTree.gen";

// O Zod v4 detecta suporte a `new Function("")` para compilar validadores.
// Com o CSP ativo (sem 'unsafe-eval') a detecção falha de forma silenciosa,
// mas gera aviso no console. Desligamos o JIT explicitamente: o Zod usa o
// caminho interpretado, compatível com a política.
configureZod({ jitless: true });

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

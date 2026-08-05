// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // `nodejs_compat` é OBRIGATÓRIA: o TanStack Start guarda o contexto da
  // requisição em um AsyncLocalStorage de `node:async_hooks`. Sem a flag (e sem
  // o preset unenv de compatibilidade Node que o Nitro só injeta quando
  // `nodeCompat` está ligado), `getRequest()` falha com
  // "No Start context found in AsyncLocalStorage".
  // Mantemos a flag ligada e fixamos uma compatibility_date recente para que o
  // Worker use o comportamento moderno de nodejs_compat (v2).
  nitro: {
    compatibilityDate: { cloudflare: "2025-07-13", default: "2025-07-13" },
    cloudflare: { nodeCompat: true },
  },

  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

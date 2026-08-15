/**
 * Configuração dos testes unitários (Vitest).
 *
 * Mantida separada do vite.config.ts para não interferir nos plugins do
 * TanStack Start. Cobre apenas funções puras — nada que dependa de banco,
 * sessão autenticada ou servidor.
 */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],
    globals: false,
  },
});

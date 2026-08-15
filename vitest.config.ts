/**
 * Configuração dos testes unitários (Vitest).
 *
 * Mantida separada do vite.config.ts para não interferir nos plugins do
 * TanStack Start. Cobre apenas funções puras — nada que dependa de banco,
 * sessão autenticada ou servidor.
 */
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],
    globals: false,
  },
});

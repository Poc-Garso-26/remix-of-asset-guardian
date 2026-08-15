/**
 * Configuração do Playwright para os testes de acessibilidade (axe-core).
 *
 * Escopo: apenas rotas públicas (ver tests/a11y/). Rotas autenticadas ficam
 * fora desta fase porque o Supabase é externo e não há como injetar sessão no
 * ambiente automatizado.
 */
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env["A11Y_BASE_URL"] ?? "http://localhost:8080";

export default defineConfig({
  testDir: "tests/a11y",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 900 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

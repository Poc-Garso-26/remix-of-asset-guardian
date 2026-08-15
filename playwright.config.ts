/**
 * Configuração do Playwright para os testes de acessibilidade (axe-core).
 *
 * Escopo: apenas rotas públicas (ver tests/a11y/). Rotas autenticadas ficam
 * fora desta fase porque o Supabase é externo e não há como injetar sessão no
 * ambiente automatizado.
 */
import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env["A11Y_BASE_URL"] ?? "http://localhost:8080";

/**
 * Em ambientes onde o Chromium já vem pré-instalado (sandbox/CI sem
 * `playwright install`), aponta para o binário existente. Se `PW_CHROMIUM_PATH`
 * não for definido e nada for encontrado, o Playwright usa o browser próprio.
 */
const CHROMIUM_CANDIDATES = [
  process.env["PW_CHROMIUM_PATH"],
  "/opt/ms-playwright/chromium-1194/chrome-linux/chrome",
].filter(Boolean) as string[];
const executablePath = CHROMIUM_CANDIDATES.find((p) => existsSync(p));

export default defineConfig({
  testDir: "tests/a11y",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
});

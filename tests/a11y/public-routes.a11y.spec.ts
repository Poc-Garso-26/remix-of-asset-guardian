/**
 * Varredura automatizada de acessibilidade (axe-core + Playwright).
 *
 * ESCOPO: SOMENTE ROTAS PÚBLICAS (/login e a rota inicial "/").
 * Rotas autenticadas (dashboard, ativos, relatórios, administração) NÃO são
 * cobertas nesta fase — limitação do ambiente automatizado (Supabase externo,
 * sem possibilidade de injetar sessão), não do teste em si. Elas entram numa
 * segunda etapa, com CI externo e credenciais de teste.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function scan(page: Page, tags: string[] = WCAG_TAGS) {
  return new AxeBuilder({ page }).withTags(tags).analyze();
}

function describeViolations(violations: Awaited<ReturnType<typeof scan>>["violations"]) {
  return violations
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes
          .map((n) => n.target.join(" "))
          .join("\n  ")}`,
    )
    .join("\n\n");
}

test.describe("Rotas públicas — WCAG 2.1 A/AA", () => {
  test("/login sem violações", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).waitFor();
    const { violations } = await scan(page);
    expect(describeViolations(violations)).toBe("");
  });

  test("/ (rota inicial) sem violações", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // "/" redireciona para a área autenticada, que redireciona ao login.
    await page.waitForURL(/\/(login|dashboard)/);
    const { violations } = await scan(page);
    expect(describeViolations(violations)).toBe("");
  });

  test("/login — contraste, ordem de títulos, landmark e rótulos", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).waitFor();
    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast", "heading-order", "landmark-one-main", "label"])
      .analyze();
    expect(describeViolations(results.violations)).toBe("");
  });
});

# Suíte de testes automatizados — Fase 1 (sem sessão autenticada)

## Situação atual (verificada)

- `package.json` tem apenas `dev`, `build`, `build:dev`, `preview`, `lint`, `format` — não existe script de typecheck nem de teste.
- Nenhuma dependência de teste instalada (sem Vitest, sem Playwright/axe no projeto) e nenhuma pasta `tests/`.
- Não existe utilitário de cálculo de contraste no código: os ajustes AAA foram feitos direto em tokens OKLCH no `src/styles.css`. Logo, essa frente do escopo não tem função pura para testar (fica registrado, sem teste).
- Funções puras existentes sem cobertura: `pdfSafeText` e `formatFileSize` (`src/lib/pdf-export.ts`), `isoToLocalDate` e os helpers de máscara/conversão em `src/components/date-field.tsx`, mapas de tipo/situação em `src/lib/assets-types.ts`, `buildContentSecurityPolicy` (`src/lib/security-headers.ts`), `cn` (`src/lib/utils.ts`).

## 1. Typecheck

- Adicionar `"typecheck": "tsc --noEmit"` em `package.json` (mesma checagem já usada a cada alteração, agora documentada).

## 2. Testes unitários (Vitest)

- Instalar `vitest` e `jsdom` como devDependencies; adicionar bloco `test` na configuração do Vite (ambiente `jsdom`, `include: ["tests/unit/**/*.test.ts"]`) reaproveitando os aliases `@/` já existentes.
- Criar `tests/unit/` com os arquivos:
  - `pdf-text.test.ts` — `pdfSafeText`: travessões, seta, bullet, aspas curvas, reticências, espaço fixo; preserva acentos (ã, ç, í); trata `null`/`undefined`/número. Mais `formatFileSize` (KB, MB com vírgula, zero → "tamanho indisponível").
  - `date-field.test.ts` — conversões ISO ↔ dd/mm/aaaa sem deslocamento de fuso, máscara durante a digitação, rejeição de datas inválidas (ex.: 31/02/2026).
  - `assets-types.test.ts` — cobertura completa de `ASSET_TYPE_LABEL`, `ASSET_TYPE_PLURAL_LABEL`, `ASSET_TYPE_LIST_ROUTE`, `ASSET_STATUS_LABEL` e `ASSET_STATUS_TONE`: uma entrada para cada tipo/situação e rotas coerentes com as rotas dedicadas existentes.
  - `security-headers.test.ts` — `buildContentSecurityPolicy`: presença de `default-src 'self'`, Supabase em `connect-src`, ViaCEP liberado, `frame-ancestors` definido.
  - `utils.test.ts` — `cn`: merge de classes conflitantes e condicionais.
- Ajuste mínimo de código de produção: exportar os helpers hoje privados de `src/components/date-field.tsx` (`isoToBr`, `brToIso`, `mask`) para permitir teste direto. Nenhuma mudança de comportamento.
- Script: `"test": "vitest run"` (e `"test:watch": "vitest"`).

## 3. Acessibilidade automatizada (axe-core + Playwright)

- Instalar `@playwright/test` e `@axe-core/playwright`; criar `playwright.config.ts` apontando para `http://localhost:8080` e `testDir: "tests/a11y"`.
- Criar `tests/a11y/public-routes.a11y.spec.ts` com comentário de cabeçalho explicitando: **cobre apenas rotas públicas**; rotas autenticadas ficam fora desta fase por limitação de ambiente (Supabase externo, sem injeção de sessão), não do teste.
  - Rotas cobertas: `/login` e `/` (rota inicial pública). Cada rota roda `AxeBuilder` com as tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` e falha se houver violação, imprimindo id, impacto e seletores.
  - Um caso extra checa explicitamente `color-contrast`, `heading-order`, `landmark-one-main` e `label` em `/login`.
- Script: `"test:a11y": "playwright test"` e `"test:all": "npm run typecheck && npm run test && npm run test:a11y"`.

## Validação

Rodar as três frentes contra o servidor de desenvolvimento já ativo e confirmar que todas passam; corrigir apenas os testes (não o app) se algum expor divergência de expectativa. Se o axe apontar violação real em rota pública, reporto o achado em vez de afrouxar o teste.

## Como rodar depois

- Suíte completa: `npm run test:all`
- Individual: `npm run typecheck`, `npm run test`, `npm run test:a11y`

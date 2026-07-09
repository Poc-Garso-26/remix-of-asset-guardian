Aplicar sequencialmente os 4 itens do Bloco D, parando após cada um para reportar o que mudou. Sem alterações visuais além do estritamente necessário.

## Item 20 — `min-h-screen` → `min-h-dvh`

- `src/routes/__root.tsx`: trocar em `NotFoundComponent` e `ErrorComponent`.
- `src/components/app-shell.tsx`: trocar no wrapper raiz (`<div className="flex min-h-screen ...">`).
- `src/routes/login.tsx`: trocar no container principal do login.

## Item 21 — Idioma do documento

- `src/routes/__root.tsx`: `<html lang="en">` → `<html lang="pt-BR">` em `RootShell`.

## Item 23 — Skip link

- `src/components/app-shell.tsx`:
  - Adicionar `<a href="#main">Pular para conteúdo principal</a>` como primeiro filho do wrapper, com classes `sr-only focus:not-sr-only` + posicionamento absoluto no foco (usando tokens existentes: `focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring`).
  - Adicionar `id="main"` no `<main>` já existente.
- `src/routes/login.tsx`: garantir `id="main"` no `<main>` já adicionado no Bloco B (o login não faz parte do AppShell; skip link só no shell autenticado, conforme instrução "reaproveitar o <main> já adicionado no login, se aplicável" — apenas garantir o `id`, sem adicionar skip link duplicado ali).

## Item 26 — Descrição textual dos gráficos

- `src/components/assets-status-chart.tsx`:
  - Adicionar `role="img"` e `aria-label` dinâmico no container do gráfico (ex.: "Gráfico de rosca: distribuição dos ativos por situação — {label}: {count} ({pct}%); ...").
  - Adicionar `<table className="sr-only">` com colunas Situação / Quantidade / Percentual, populada a partir de `chartData`.
- `src/components/assets-timeline-chart.tsx`:
  - Manter `aria-label` já existente e reforçar com `role="img"`.
  - Adicionar `<table className="sr-only">` com colunas Mês / Aquisições a partir de `data`.

## Validação final

Após aplicar os 4 itens, resumir arquivos alterados e orientar validação:
1. Tab na primeira interação → skip link visível.
2. Redimensionar para mobile → conteúdo não corta com barras do navegador.
3. Inspecionar `<html lang>` = `pt-BR`.
4. Leitor de tela lê rótulo dos gráficos + tabela oculta.

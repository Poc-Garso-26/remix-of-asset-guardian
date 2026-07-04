# Gráfico "Situação dos Ativos" no Dashboard

Adicionar um novo card na rota `/dashboard` com um gráfico Doughnut mostrando a distribuição de ativos por Situação (campo `status`).

## Escopo

- Novo card ao lado / abaixo dos cards existentes em `src/routes/_authenticated.dashboard.tsx`.
- Título: **Situação dos Ativos**.
- Gráfico Doughnut à esquerda, legenda automática à direita (empilha abaixo em telas menores).
- Tooltip por setor com: Situação, Quantidade, Percentual (`ex.: 72,5%`).
- Skeleton durante loading, mensagem "Nenhum dado encontrado." quando vazio, tratamento de erro consistente.

## Dados

- Reutiliza a mesma fonte do cadastro (`supabase.from("assets")`).
- Estender `assetsService` com `statusDistribution()` que faz um `select("status")` enxuto (sem joins), agrupando no cliente por `status` (Postgres via PostgREST não faz `group by` nativo; buscar só a coluna `status` mantém a consulta leve).
- Retorno: `Array<{ status: AssetStatus; label: string; count: number }>`.
- Consumido via `useQuery({ queryKey: ["assets-status-distribution"] })`.

## UI / Design System

- Reutiliza componentes existentes: `Card` shadcn, `ChartContainer`/`ChartTooltip`/`ChartTooltipContent`/`ChartLegend`/`ChartLegendContent` (`src/components/ui/chart.tsx` — Recharts já instalado).
- Renderiza `PieChart` com `Pie` (`innerRadius` ~60, `outerRadius` ~90) para efeito donut.
- Cores por status através de tokens semânticos do tema (mapeando `ASSET_STATUS_TONE`):
  - `em_uso` → `hsl(var(--success))`
  - `estoque` → `hsl(var(--info))` (fallback `--primary` se não existir)
  - `manutencao` → `hsl(var(--warning))`
  - `baixado` → `hsl(var(--muted-foreground))`
  - Fallback para status futuros: paleta cíclica `--chart-1..5` (ou geradas via HSL determinística sobre o nome) — sem alteração de código quando surgirem novas situações.
- Labels via `ASSET_STATUS_LABEL`.
- Skeleton (`src/components/ui/skeleton.tsx`) com forma de círculo + linhas para a legenda.
- Estado de erro reaproveita o padrão já usado no dashboard (mensagem inline em `text-destructive`).

## Arquivos

- `src/lib/assets-service.ts` — adicionar `statusDistribution()`.
- `src/components/assets-status-chart.tsx` (novo) — card auto-contido com query, loading, erro, vazio e gráfico.
- `src/routes/_authenticated.dashboard.tsx` — inserir `<AssetsStatusChart />` numa nova linha da grid, sem alterar cards existentes.

## Fora de escopo

- Nenhuma alteração em outros fluxos, filtros globais (dashboard não possui), backend, migrations ou dependências (Recharts já presente).

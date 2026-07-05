# Aquisições de Ativos ao Longo do Tempo

Adicionar um novo gráfico de área ao `/dashboard` mostrando a evolução mensal de novos ativos cadastrados nos últimos 12 meses, seguindo o mesmo Design System já usado em `AssetsStatusChart`.

## Layout

Na `section` já existente que hospeda o gráfico de Situação (`grid lg:grid-cols-3`), o novo gráfico ocupa a coluna restante (`lg:col-span-1` ao lado do doughnut). Em telas menores, empilha naturalmente abaixo.

```text
┌──────────────────────────────┬───────────────┐
│  Situação dos Ativos (donut) │  Aquisições   │
│         lg:col-span-2        │  lg:col-span-1│
└──────────────────────────────┴───────────────┘
```

## O que construir

1. **`src/lib/assets-service.ts`** — novo método `acquisitionsTimeline()`:
   - `select("created_at, acquisition_date")` de `assets`, limite 10000.
   - Preferir `acquisition_date`; fallback para `created_at` quando nulo.
   - Agrupar por mês (`YYYY-MM`) nos últimos 12 meses, preenchendo meses sem dados com `count: 0`.
   - Retorna `Array<{ month: string; label: string; count: number }>` ordenado cronologicamente. `label` no formato `"jan/25"` (pt-BR abreviado).

2. **`src/components/assets-timeline-chart.tsx`** (novo) — segue o padrão de `assets-status-chart.tsx`:
   - `Card` + `CardHeader` (título "Aquisições nos últimos 12 meses" + descrição curta) + `CardContent`.
   - `ChartContainer` com `AreaChart` do Recharts: `XAxis dataKey="label"`, `YAxis` oculto, `CartesianGrid` sutil, `Area` com `type="monotone"`, `stroke="hsl(var(--primary))"`, `fill="url(#acqGradient)"` (gradient linear do primary → transparente).
   - `ChartTooltip` + `ChartTooltipContent` do Design System.
   - Estados: skeleton no loading, mensagem de erro com botão "Tentar novamente" (chamando `refetch`), estado vazio "Sem aquisições no período.".

3. **`src/routes/_authenticated.dashboard.tsx`** — importar `AssetsTimelineChart` e inseri-lo dentro da mesma `section` do doughnut, na terceira coluna do grid.

## Detalhes técnicos

- Data fetching: `useQuery` com `queryKey: ["assets", "acquisitions-timeline"]`, mesmo padrão de `AssetsStatusChart`.
- Sem novas dependências (Recharts, shadcn/chart e date utils já disponíveis).
- Sem alterações de schema, RLS ou migrations — usa apenas `SELECT` sobre `assets`.
- Formatação de mês via `Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" })`.
- Responsividade herdada do `ChartContainer` (aspect-video) — igual ao donut.
- Acessibilidade: `aria-label` no card, tooltip acessível pelo componente do DS.

## Critérios de aceite

- Novo card aparece à direita do gráfico de Situação em `lg`, empilha em telas menores.
- Mostra 12 meses (inclui meses zerados).
- Loading, erro (com retry) e vazio tratados.
- Zero regressão nas seções existentes do Dashboard.

# Bloco G-3 — Tooltips dos gráficos acessíveis via teclado

## Objetivo
Tornar as informações dos gráficos do Dashboard (rosca de situação e linha de aquisições) disponíveis para quem navega por teclado sem depender de hover do mouse, e melhorar o rótulo de mês no tooltip do timeline.

## Alterações

### 1) `src/components/assets-status-chart.tsx` — foco por fatia
- Remover, do `useEffect` atual, a força de `tabindex="-1"` nos setores individuais (`<path>` das fatias). Continuar zerando o tabindex apenas do `<svg>` raiz e de wrappers `[tabindex]` genéricos do Recharts, mas **preservar/definir** `tabIndex=0` nos elementos `.recharts-sector` (uma fatia por status).
- Adicionar `aria-label` em cada sector (ex.: `"Em uso: 12 (35,3%)"`) via `useEffect` para expor a informação também a leitores de tela que percorrem por Tab (redundante com a tabela `sr-only`, mas útil).
- Controlar tooltip por estado (`activeIndex`) usando as props do `<Pie>` (`activeIndex`, `activeShape` default do Recharts) e disparar `setActiveIndex` tanto em `onMouseEnter`/`onMouseLeave` do Pie quanto via handlers `focus`/`blur` aplicados no `useEffect` aos `.recharts-sector`. No blur do último sector, limpar `activeIndex` para esconder o tooltip.
- Nenhuma mudança visual: o tooltip renderizado é o mesmo `ChartTooltipContent` já configurado.

### 2) `src/components/assets-timeline-chart.tsx` — foco por ponto + rótulo completo
- Trocar `<Area>` por combinação de área + `dot` visível/focável: usar `dot={{ r: 3 }}` e `activeDot={{ r: 5 }}` para que o Recharts gere `<circle class="recharts-dot">` por ponto.
- No `useEffect` existente: manter `tabindex="-1"` no `<svg>` raiz e em wrappers genéricos; **atribuir** `tabIndex=0` em cada `.recharts-dot` e associar handlers de `focus`/`blur` que atualizam um estado `activeLabel` usado para forçar o tooltip via prop `active`/`payload` (padrão suportado pelo `Tooltip` do Recharts controlado — ou, alternativamente, disparar programaticamente `mouseenter` no ponto via `dispatchEvent`, mantendo estado simples).
- Adicionar `aria-label` em cada dot com o rótulo completo do mês + contagem (ex.: `"dezembro de 2025: 4 aquisições"`).

### 3) Rótulo completo de mês
- Em `src/lib/assets-service.ts` (`acquisitionsTimeline`): adicionar um segundo campo `fullLabel` no bucket usando `Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })` (ex.: `"dezembro de 2025"`). Manter `label` curto atual para o eixo X.
- Em `assets-timeline-chart.tsx`: passar um `labelFormatter` ao `ChartTooltipContent` que troque o `label` curto pelo `fullLabel` do payload; também usar `fullLabel` no `aria-label` dos dots e na tabela `sr-only`.

### 4) Preservar Bloco G-1
Os SVGs raiz e wrappers genéricos continuam com `tabindex="-1"`. Apenas os elementos de dados (`.recharts-sector`, `.recharts-dot`) recebem `tabIndex=0`, exatamente os pontos onde o tooltip deve aparecer.

## Como testar
1. No `/dashboard`, tabular até o gráfico de rosca: o Tab deve parar em cada fatia (uma por status). A cada foco, o tooltip aparece com "Situação: N (P%)". Shift+Tab reverte.
2. Continuar tabulando até o gráfico de linha: o Tab passa por cada ponto mensal; o tooltip mostra "dezembro de 2025 — Aquisições: N" (mês por extenso + ano).
3. Passar o mouse continua funcionando igual. Leitor de tela: tabela `sr-only` inalterada; adicionalmente, cada fatia/ponto anuncia seu `aria-label`.
4. Build (`bun run build` implícito pelo harness) sem erros.

## Arquivos
- `src/components/assets-status-chart.tsx`
- `src/components/assets-timeline-chart.tsx`
- `src/lib/assets-service.ts`

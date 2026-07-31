# Bloco G-3 (retomada) — corrigir navegação por teclado nos gráficos

## Diagnóstico

Investiguei o DOM ao vivo e o código. O `LOVABLE_BROWSER_AUTH_STATUS` deste projeto é `external_unmanaged`, então não consigo abrir `/dashboard` autenticado no sandbox para medir `document.activeElement` — a verificação final por teclado terá de ser sua. O que consegui confirmar por código explica os sintomas relatados:

1. **Causa raiz principal — o efeito roda antes dos elementos existirem.** Os gráficos ficam dentro de `ChartContainer`, que usa o `ResponsiveContainer` do Recharts. Ele só renderiza o `<svg>` depois que o `ResizeObserver` mede a largura do contêiner, ou seja, **depois** do `useEffect`. Como as dependências do efeito (`[chartData, total]` / `[data]`) não mudam mais após a chegada dos dados, `querySelectorAll('.recharts-sector')` retorna vazio e o efeito nunca reexecuta. Nada recebe `tabindex`.
2. **Agravante no gráfico de linha:** os pontos (`.recharts-area-dots .recharts-dot`) só são montados no fim da animação de entrada da área — bem depois do efeito.
3. **Foco invisível mesmo se aplicado:** `src/components/ui/chart.tsx` força `[&_.recharts-sector]:outline-none`, `[&_.recharts-layer]:outline-none` e `[&_.recharts-surface]:outline-none`, e o código atual ainda define `style.outline = "none"` em cada fatia/ponto. Portanto, mesmo com foco, não haveria indicação visual.
4. **Rótulo não anunciado:** o wrapper tem `role="img"`. Elementos dentro de um `role="img"` são tratados como presentacionais pelas tecnologias assistivas, então o `aria-label` de cada fatia focada seria ignorado.
5. **Compatibilidade de SVG:** `tabindex` em `<path>`/`<circle>` funciona em Chrome/Firefox atuais, mas convém adicionar `focusable="true"` por segurança em navegadores mais antigos/WebKit.

## O que será mudado

Em `src/components/assets-status-chart.tsx` e `src/components/assets-timeline-chart.tsx`:

- **Unificar em um único efeito** que primeiro neutraliza o foco dos elementos genéricos (`<svg>`, `.recharts-wrapper[tabindex]`, preservando o Bloco G-1) e depois aplica foco aos elementos de dados.
- **Aguardar a renderização real** com um `MutationObserver` no contêiner do gráfico: a cada mutação, reaplica a marcação; para de observar quando o número esperado de fatias/pontos já está marcado (com fallback que continua observando enquanto o componente estiver montado, para sobreviver a re-renders e resize).
- Em cada fatia/ponto: `tabindex="0"`, `focusable="true"`, `role="img"`, `aria-label` com valor e percentual (rosca) ou mês completo e quantidade (linha) — mantendo o disparo dos eventos de mouse no `focus`/`blur` para exibir o tooltip existente, sem mudar a aparência dele.
- **Indicação visual de foco:** remover o `outline: none` inline e adicionar regra CSS de foco visível para esses elementos (contorno sólido de 2px com offset, usando token de cor existente), com especificidade suficiente para vencer os `outline-none` de `chart.tsx`. Sem foco, a aparência dos gráficos fica idêntica.
- **Remover o `role="img"` do wrapper** (mantendo o `aria-label` como `aria-roledescription`/`aria-label` em um contêiner `role="group"`), para que fatias e pontos focados sejam anunciados. A tabela `sr-only` e o `labelFormatter` ficam intocados, como você pediu.

## Como você valida

1. `/dashboard`, Tab a partir do link "Ver todos": o foco deve entrar fatia por fatia na rosca, com contorno visível e tooltip aparecendo.
2. Continuar tabulando: o foco percorre cada ponto mensal do gráfico de linha.
3. No console: `document.activeElement` deve retornar `path.recharts-sector` / `circle.recharts-dot` e `document.activeElement.getAttribute('aria-label')` o texto correspondente.
4. Hover com mouse permanece igual.

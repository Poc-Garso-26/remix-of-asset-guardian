## Refatoração visual e A11y — Dashboard

Apenas classes Tailwind/tokens, ícones e variantes de cor. Sem alterar estrutura, lógica, hooks, tipos ou dados.

### 1) `src/components/status-badge.tsx` — contraste + ícones (suporte a daltonismo)

- Substituir `TONE_CLASS` por variantes com fundo mais saturado e texto claro garantindo ≥ 4.5:1 nos temas claro/escuro:
  - `success`: `bg-success text-success-foreground border-success/40` (verde escuro + texto claro)
  - `info`: `bg-info text-info-foreground border-info/40`
  - `warning`: `bg-warning text-warning-foreground border-warning/50`
  - `muted`: `bg-muted-foreground/15 text-foreground border-border` (mantém contraste em ambos temas)
- Remover o pontinho colorido (`<span class="h-1.5 w-1.5 rounded-full">`) e renderizar no lugar um ícone lucide pequeno (`h-3 w-3`) por status, mapeado em `TONE_ICON`:
  - `success` → `CheckCircle2`
  - `info` → `Package`
  - `warning` → `Wrench`
  - `muted` → `Archive`
- Manter padding/tipografia atuais (`px-2 py-0.5 text-xs font-medium`, `gap-1.5`) para não aumentar altura.
- `aria-hidden` no ícone (o texto do label já comunica o estado).

### 2) `src/routes/_authenticated.dashboard.tsx` — hierarquia visual

- **Saudação secundária** (`<p class="mt-1 text-sm text-muted-foreground">…`): trocar `text-muted-foreground` por `text-foreground/80` para elevar contraste sobre o fundo, mantendo `<span class="font-medium text-foreground">` no nome do papel.
- **Card "Total de ativos"**: trocar ícone `Boxes` por `Package` (lucide) no array `cards`. Demais cards inalterados.
- **Cabeçalho da tabela** ("Últimos ativos cadastrados"):
  - `<thead class="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">` → trocar `text-muted-foreground` por `text-foreground/80` (mantém o tom institucional, atinge contraste AA sobre `bg-muted/50`).
  - Manter `font-medium` já existente nos `<th>`.
- **Linhas da tabela**:
  - Coluna **Patrimônio**: `<td class="px-3 py-2 font-mono text-xs">` → adicionar `font-bold` (`font-mono text-xs font-bold text-foreground`).
  - Coluna **Modelo**: `<td class="px-3 py-2">` → adicionar `font-normal text-foreground/90` para reduzir competição com o patrimônio.
  - Colunas **Tipo** e **Responsável**: trocar `text-muted-foreground` por `text-foreground/75` para atingir AA mantendo a hierarquia secundária.
  - Coluna **Situação**: inalterada (passa a usar o novo `StatusBadge`).
- **Card "Cadastros do mês"**: subtítulo `Últimos 30 dias` e parágrafo final passam de `text-muted-foreground` para `text-foreground/75`.

### 3) Imports

- `dashboard.tsx`: remover `Boxes` de `lucide-react` (não mais usado) e adicionar `Package`. `Monitor`, `Laptop`, `Printer`, `TrendingUp`, `ArrowUpRight` permanecem.
- `status-badge.tsx`: importar `CheckCircle2`, `Package`, `Wrench`, `Archive` de `lucide-react`.

### Fora do escopo (não alterar)

- `app-shell.tsx`, rotas, navegação, providers, hooks, tipos (`assets-types.ts`), serviços, lógica de estado/loading.
- Tokens em `src/styles.css` (uso apenas das variáveis semânticas já existentes — `success/info/warning/muted/foreground` e variantes `/foreground`).

### Verificação

- Badges renderizam com ícone + label, contraste ≥ 4.5:1 em light/dark.
- Patrimônio em negrito sobressai; Modelo em peso normal.
- Ícone do card "Total de ativos" é `Package`, distinto do logo `GestãoTI` (`Boxes`).
- Texto "Você está conectado como…" e cabeçalhos de tabela legíveis no tema escuro.
- Nenhuma mudança de comportamento, rota, ou shape de dados.

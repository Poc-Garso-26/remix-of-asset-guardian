# Bloco G-12 — Indicações visuais não dependentes de cor

## Item 1 — Item ativo do menu lateral

Arquivo: `src/components/app-shell.tsx` (função `itemClass`).

- Adicionar ao item ativo uma **borda lateral esquerda espessa** (`border-l-4`) além do fundo já existente, com `border-l-4 border-transparent` nos itens inativos para não deslocar o layout.
- Trocar `font-semibold` por `font-bold` no item ativo, reforçando o contraste de peso.
- No estado recolhido (`collapsed`), a borda continua visível na faixa de ícones; padding ajustado (`pl-1.5`) para compensar a borda e manter o alinhamento dos ícones.

## Item 2 — Cabeçalhos ordenáveis da tabela de ativos

Arquivo: `src/components/assets-list-page.tsx` (`<thead>` da tabela).

- Mostrar **sempre** um indicador de ordenação ao lado do rótulo dos cabeçalhos clicáveis: `↕` quando a coluna não é a ativa (em opacidade reduzida) e `↑`/`↓` quando é a coluna ativa. Ícones com `aria-hidden` — a semântica continua via `aria-sort`.
- Hover mais evidente: sublinhado (`hover:underline`) mais fundo sutil no botão (`hover:bg-muted`), mantendo a paleta atual (tokens existentes, sem novas cores).
- Confirmar `cursor-pointer` no botão de cabeçalho.
- A coluna não ordenável (`qrCode`) e "Ações" permanecem sem ícone, criando a distinção clara entre interativo e não interativo.

## Notas técnicas

- Nenhuma mudança de dados, ordenação ou lógica de filtro; apenas classes e marcação de apresentação.
- Sem novos tokens de cor; uso apenas de `border-`/`bg-muted`/`text-foreground` já existentes.

## Validação

- Typecheck (`tsgo`) e build.
- Playwright para a tabela não é possível autenticado (Supabase externo, sandbox cai em `/login`). Teste manual: em `/ativos`, conferir setas `↕` visíveis em todos os cabeçalhos ordenáveis e hover com sublinhado; no menu, conferir a borda esquerda no item da página atual (inclusive com o menu recolhido) e em modo escala de cinza.

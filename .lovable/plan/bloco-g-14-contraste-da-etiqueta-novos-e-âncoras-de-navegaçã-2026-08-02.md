# Bloco G-14 — Contraste da etiqueta "novos" e âncoras de navegação

Dois itens independentes, últimos desta rodada.

## Item 1 — Contraste da etiqueta "novos" (Dashboard)

Hoje, em `src/routes/_authenticated.dashboard.tsx` (card "Cadastros do mês"), a etiqueta usa `bg-success/10` + `text-success`. Medição a partir dos tokens reais de `src/styles.css`:

- Tema claro: `--pi-success` (oklch 0.58 0.14 150) sobre `success/10` composto no card branco → **3.57:1** (falha em 1.4.3).
- Tema escuro: 5.89:1 (já passa, mas fica inconsistente com o claro).

Correção: usar os tokens de par texto/fundo já existentes no design system (o mesmo padrão de Perfil e Administração):

- texto: `text-[color:var(--pi-success-text-emphasis)]`
- fundo: `bg-[color:var(--pi-success-bg-subtle)]`
- borda opcional para reforço não-cromático: `border border-[color:var(--pi-success-border-subtle)]`

Contraste resultante medido pelos tokens:

- Claro: **6.89:1**
- Escuro: **8.74:1**

Ambos acima de 4.5:1. Os tokens também têm variantes no tema de alto contraste, então esse modo continua coberto.

## Item 2 — Âncora "Pular para a tabela de ativos"

Decisão de escopo: adicionar **uma** âncora, apenas na listagem de ativos (`src/components/assets-list-page.tsx`, que serve `/ativos`, `/ativos/computadores`, `/ativos/notebooks`, `/ativos/impressoras`).

Por quê: é a única tela com um bloco extenso e repetitivo antes do conteúdo principal — busca rápida, dois selects de filtro, painel de filtros avançados com vários campos e o botão "Pesquisar" — que o usuário de teclado precisa atravessar a cada visita para chegar à tabela. No Dashboard os cards são poucos e em sua maioria não focáveis, então uma âncora ali agrega pouco e só polui a ordem de tabulação; não será adicionada.

Implementação:

- Link `<a href="#tabela-ativos">Pular para a tabela de ativos</a>` como primeiro elemento do container da página, com o mesmo padrão visual do skip link existente em `app-shell.tsx` (`sr-only focus:not-sr-only ...`), posicionado no fluxo (não fixo) para não conflitar com o skip link do topo.
- O wrapper da tabela recebe `id="tabela-ativos"` e `tabIndex={-1}` (mesma técnica usada no `<main>`), garantindo que o foco realmente se mova ao ativar a âncora.
- Nada de comportamento de filtro/busca muda.

## Arquivos alterados

- `src/routes/_authenticated.dashboard.tsx` (item 1)
- `src/components/assets-list-page.tsx` (item 2)

## Validação

- Recálculo de contraste a partir dos tokens de `styles.css` (método dos Blocos G-5 e G-13), já feito acima; reconfirmado após a edição.
- Typecheck com `tsgo`.
- As duas telas exigem sessão autenticada e este projeto usa Supabase externo, sem sessão disponível no sandbox — então a verificação visual/teclado será entregue como roteiro manual: no Dashboard conferir a etiqueta nos temas claro e escuro; em `/ativos` pressionar Tab no início da página, ativar "Pular para a tabela de ativos" e confirmar via console que `document.activeElement.id === "tabela-ativos"`.

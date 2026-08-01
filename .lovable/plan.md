# Bloco G-13

Dois itens independentes de indicação visual não dependente de cor e contraste de estados.

## Item 1 — "Voltar ao ativo" precisa de indicador além da cor

Onde: `src/routes/_authenticated.ativos.$id.editar.tsx`.

Situação atual (verificada): o botão já tem o ícone `ChevronLeft` sempre visível, mas o ícone é pequeno (12px) e não há sublinhado; a percepção de interatividade vem quase só da cor do texto.

Correção:
- Sublinhado permanente discreto (`underline underline-offset-4 decoration-dotted`) que passa a sólido no hover/foco (`hover:decoration-solid`), somado à mudança de cor já existente.
- Ícone `ChevronLeft` aumentado para 16px (`h-4 w-4`) para leitura clara como affordance de "voltar".
- Anel de foco visível (`focus-visible:ring-2 focus-visible:ring-ring rounded-md`).
- Aplicar o mesmo padrão nos outros botões/links "Voltar" equivalentes das telas de ativo, para consistência (detalhe do ativo e novo ativo), sem mudar texto nem comportamento.

## Item 2 — Contraste entre habilitado e desabilitado na paginação

Onde: `src/components/assets-list-page.tsx`, componente `PageBtn` (usado por "Anterior"/"Próxima").

Situação atual (verificada): o único diferencial é `disabled:opacity-50`, que reduz simultaneamente texto e borda — no tema claro isso deixa o texto/borda do botão desabilitado por volta de 2:1 contra o fundo do card.

Correção: substituir `disabled:opacity-50` por estados explícitos.
- Habilitado: mantém `bg-card`, `text-foreground`, `border-border` (sem alteração).
- Desabilitado: `bg-muted`, `text-muted-foreground`, `border-border`, `border-dashed`, `cursor-not-allowed` e sem hover.
- A borda tracejada adiciona uma segunda pista (forma) além da cor, e o fundo `muted` diferencia o estado sem depender de opacidade.

Contraste esperado com os tokens atuais (texto do botão desabilitado contra seu próprio fundo):
- claro: `--muted-foreground` L≈0.50 sobre `--muted` L≈0.96 → ≈ 5:1
- escuro: `--muted-foreground` L≈0.72 sobre `--muted` L≈0.27 → ≈ 6:1

Ambos acima de 3:1 (WCAG 1.4.11), e o par habilitado/desabilitado passa a diferir em fundo, cor de texto e estilo de borda.

## Validação

- Cálculo dos valores de contraste a partir dos tokens em `src/styles.css` (mesma abordagem do Bloco G-5), reportando antes/depois.
- Typecheck e checagem de console.
- Telas autenticadas não abrem no sandbox (Supabase externo): será indicado o roteiro manual — em `/ativos` na primeira página, conferir "Anterior" desabilitado com fundo/borda distintos, e em `/ativos/{id}/editar` conferir o sublinhado e o ícone do "Voltar ao ativo" nos temas claro e escuro.

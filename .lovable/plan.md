# Card "Todos os ativos" clicável no Dashboard

Tornar o quarto card do Dashboard um link para a listagem completa, igual ao item "Todos os ativos" do menu lateral.

## Mudança

Arquivo único: `src/routes/_authenticated.dashboard.tsx`

- No array `cards`, adicionar `to: "/ativos"` ao item "Todos os ativos" (sem `search`, sem filtro de tipo).
- Com isso ele passa a cair no mesmo ramo de renderização `<Link to={...}>` dos outros três cards, herdando automaticamente o mesmo visual: borda/sombra no hover, ícone `ArrowUpRight` que aparece no hover e cursor de link.
- Nome acessível: adicionar `aria-label="Todos os ativos — ver listagem completa"` no `Link`, e manter o mesmo padrão nos outros três (`aria-label` com o tipo + "ver listagem"), para que o nome do link não seja apenas o número. Texto, valor e layout permanecem intactos.

## Validação

- Typecheck do projeto.
- Verificação no `routeTree.gen.ts` de que `/ativos` (rota `/_authenticated/ativos/`) existe e aceita navegação sem parâmetros de busca.
- O Dashboard está sob rota autenticada; se não for possível autenticar automaticamente no sandbox, aviso e indico o teste manual: abrir `/dashboard`, clicar no card "Todos os ativos" e confirmar a chegada em `/ativos` sem filtro de tipo aplicado, com o mesmo efeito de hover dos demais cards.

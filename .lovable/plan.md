# Causa raiz do `aria-current="page"` no primeiro item do breadcrumb

## O que a investigação mostrou

1. `src/components/breadcrumbs.tsx` está com a versão corrigida: `aria-current="page"` é escrito explicitamente apenas no último item (`BreadcrumbPage`), e os itens intermediários usam `BreadcrumbLink` sem esse atributo.
2. Não existe componente de breadcrumb duplicado nem `useEffect` mexendo no DOM da trilha. Só há dois arquivos envolvidos: `src/components/breadcrumbs.tsx` e o primitivo `src/components/ui/breadcrumb.tsx`.
3. Não é cache nem build desatualizada.

**A causa real é o `<Link>` do TanStack Router.** O router adiciona automaticamente `data-status="active"` e `aria-current="page"` em todo link considerado *ativo*, e esses atributos são aplicados **depois** das props do desenvolvedor (ou seja, sobrescrevem qualquer valor nosso). Por padrão a comparação de rota não é exata (`activeOptions.exact = false`), então na rota `/ativos/123/editar` o link `Inventário` → `/ativos` (e também `Todos os ativos` e `PAT-00109`) é tratado como ativo e recebe `aria-current="page"`.

Como `document.querySelector` devolve o **primeiro** nó correspondente, o console retorna `"Inventário"` — mesmo com o último item também tendo `aria-current="page"` corretamente. Ou seja: hoje existem vários `aria-current="page"` na trilha, não um só.

## Correção proposta

Em `src/components/breadcrumbs.tsx`, nos links intermediários:

- passar `activeOptions={{ exact: true, includeSearch: false, includeHash: false }}` ao `<Link>`, de forma que links de rotas-pai (`/ativos`, `/ativos/$id`) não sejam marcados como ativos em rotas filhas;
- manter `aria-current="page"` apenas no `BreadcrumbPage` (último item), como já está.

Resultado esperado: exatamente um `aria-current="page"` por trilha, sempre no último item, sem alterar aparência nem navegação.

## Validação

- `tsgo` limpo.
- Verificação via Playwright/console em `/ativos/:id` e `/ativos/:id/editar`:
  - `document.querySelectorAll('nav[aria-label="Breadcrumb"] [aria-current="page"]').length` → `1`
  - `document.querySelector('nav[aria-label="Breadcrumb"] [aria-current="page"]').textContent` → `PAT-00109` (detalhe) / `Editar` (edição) / `Novo ativo` (cadastro).

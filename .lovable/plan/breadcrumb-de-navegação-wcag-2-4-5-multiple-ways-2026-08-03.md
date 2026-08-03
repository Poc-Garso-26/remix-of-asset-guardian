# Breadcrumb de navegação (WCAG 2.4.5 — Multiple Ways)

Adicionar uma linha de breadcrumb nas páginas de segundo nível do inventário, sem alterar mais nada no layout.

## Onde entra

| Página | Trilha |
| --- | --- |
| Detalhe do ativo (`/ativos/$id`) | Inventário › Todos os ativos › PAT-00102 |
| Edição de ativo (`/ativos/$id/editar`) | Inventário › Todos os ativos › PAT-00102 › Editar |
| Novo ativo (`/ativos/novo`) | Inventário › Todos os ativos › Novo ativo |

- "Inventário" e "Todos os ativos" são links (`/ativos` para ambos os níveis: "Inventário" aponta para `/ativos`, que é a raiz da seção). No detalhe, o patrimônio é o item atual; na edição, ele volta a ser link para o detalhe.
- Último item: texto simples com `aria-current="page"`.
- O rótulo "INVENTÁRIO" acima do título permanece intacto; o breadcrumb é uma linha nova acima dele.

## Não entra

- Dashboard, Todos os ativos, Administração, Relatórios (destinos diretos do menu).
- Listas por tipo (`/ativos/computadores`, `/notebooks`, `/impressoras`) — também são itens diretos do menu lateral.
- Administração e Relatórios não têm sub-rotas: edição de usuário e geração de relatório acontecem em diálogos/na própria página, sem hierarquia mais profunda. Portanto sem breadcrumb ali.

## Detalhes técnicos

- Reaproveitar `src/components/ui/breadcrumb.tsx` (shadcn já presente): `Breadcrumb` (renderiza `<nav aria-label="breadcrumb">` + `<ol>`), `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink asChild` com `<Link>` do TanStack Router, `BreadcrumbSeparator` (`›` via ícone/caractere, `aria-hidden`) e `BreadcrumbPage` para o item atual (`aria-current="page"`).
- Criar `src/components/breadcrumbs.tsx`: componente reutilizável que recebe `items: { label: string; to?: string; params?: Record<string,string> }[]` e renderiza a trilha, com o último item sempre como `BreadcrumbPage`.
- Inserir `<Breadcrumbs …/>` como primeiro elemento dentro do container de cada uma das três rotas, antes do `<header>`. Nenhuma outra mudança de espaçamento/estrutura.
- Alvo de área de acionamento e foco: manter os mesmos padrões já usados nos links do projeto (mín. 24px, anel de foco visível).

## Validação

- Typecheck (`tsgo`).
- Playwright no sandbox para verificar marcação (`nav[aria-label]`, `ol`, `aria-current="page"`) no que for alcançável sem sessão.
- As três páginas exigem sessão autenticada (Supabase externo) — informarei o roteiro de teste manual: abrir um ativo, conferir a trilha, clicar em "Todos os ativos", e repetir em Editar e Novo ativo.

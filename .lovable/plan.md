
# Bloco A — Correções críticas de teclado

Escopo restrito aos itens 2, 3, 6, 7 e 8 da auditoria. Nenhuma mudança visual pretendida — apenas comportamento de teclado, semântica ARIA e foco.

## Item 2 — Linhas de tabela clicáveis (`assets-list-page.tsx`)
- Remover `onClick={() => navigate(...)}` e `cursor-pointer` do `<tr>`.
- Transformar a célula de **Patrimônio** em um `<Link to="/ativos/$id" params={{ id: a.id }}>` estilizado como o texto atual (mantém a aparência).
- Manter os botões de ação (`Eye`, `Pencil`, `Trash2`) inalterados; remover os `e.stopPropagation()` que deixam de ser necessários.

## Item 3 — Cabeçalhos ordenáveis (`assets-list-page.tsx`)
- Envolver o conteúdo de cada `<th>` sortável em `<button type="button">` com o mesmo handler de ordenação.
- Adicionar `aria-sort` no `<th>`: `"ascending"` / `"descending"` na coluna ativa, `"none"` nas demais sortáveis.
- Botão sem borda extra para não alterar o visual (`inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded`).

## Item 6 — Rótulo acessível no sidebar recolhido (`app-shell.tsx`)
- Nos `<Link>` de navegação e no botão **Sair**: sempre passar `aria-label={item.label}` (e `"Sair"` / `"Perfil"`).
- Manter `<span className={labelClass}>` como está (esconde visualmente quando recolhido) — o `aria-label` garante o nome acessível em qualquer estado.

## Item 7 — `aria-expanded` / `aria-controls` do botão de menu (`app-shell.tsx`)
- Adicionar `id="app-sidebar"` no `<aside>`.
- No botão do header: `aria-controls="app-sidebar"` e `aria-expanded` refletindo o estado real:
  - mobile (`window.innerWidth < 1024`): `mobileOpen`.
  - desktop: `!collapsed`.
- Como `window` não existe no SSR, calcular o estado via um `useIsMobile` (já existe em `src/hooks/use-mobile.tsx`) para evitar mismatch de hidratação.

## Item 8 — Drawer mobile: Esc + foco + backdrop acessível (`app-shell.tsx`)
- Ao abrir (`mobileOpen === true`):
  - `useEffect` que adiciona `keydown` global; se `Escape`, fecha.
  - Mover foco para o botão "Fechar menu" do `<aside>` (via `ref`).
- Ao fechar: restaurar foco para o botão do header (via `ref`).
- Backdrop: trocar `<div onClick>` por `<button type="button" aria-label="Fechar menu" onClick={...}>` com as mesmas classes de posição/fundo — mantém o visual, ganha teclado.
- Adicionar `role="dialog"` e `aria-modal="true"` no `<aside>` **apenas quando** `mobileOpen` (para não afetar o layout desktop, onde o aside é navegação persistente).

## Validação
- `bun run build` (a plataforma já roda typecheck automático).
- Playwright headless para conferir visualmente que nada mudou:
  1. `/login` — layout intacto.
  2. `/ativos` — tabela renderiza igual; Tab foca patrimônio (link) e cabeçalhos (botões); Enter em cabeçalho ordena.
  3. Mobile (viewport 375): abrir menu pelo botão, `Esc` fecha e devolve foco.
- Screenshots antes/depois em `/tmp/browser/a11y-bloco-a/`.

## Fora de escopo (ficam para blocos seguintes)
- Itens 1, 4, 5 (Bloco B — semântica/labels).
- Qualquer ajuste de contraste, `aria-live`, `lang="pt-BR"`, etc.

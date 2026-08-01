# Bloco G-7 — Região de notificações em português e captions nas tabelas

## Item 1 — Seção "Notifications" em inglês

### Origem confirmada
A seção é gerada pelo **Sonner**. O componente `<Toaster />` (de `src/components/ui/sonner.tsx`) é renderizado em `src/routes/__root.tsx` (linha 126), logo após `<Outlet />` — ou seja, fora de qualquer landmark. O Sonner cria internamente
`<section aria-label="Notifications alt+T" tabindex="-1" aria-live="polite">`, com o rótulo padrão em inglês e o atalho `alt+T`.

### Correção
- Em `src/components/ui/sonner.tsx`: passar as props nativas do Sonner
  - `containerAriaLabel="Notificações"` (substitui "Notifications")
  - `hotkey={["altKey", "KeyT"]}` mantido (padrão), sem mudança de comportamento
- Em `src/routes/__root.tsx`: envolver o `<Toaster />` em um landmark dedicado
  `<aside aria-label="Notificações do sistema">`. Como o Sonner posiciona a região com `position: fixed`, não há impacto visual.

Resultado: o leitor de tela anuncia "Notificações" em português, dentro de um landmark complementar.

## Item 2 — Tabelas sem `<caption>`

Adicionar `<caption className="sr-only">` (oculto visualmente, pois todas já têm heading acima) em cada tabela HTML que hoje não possui:

| Arquivo | Caption |
| --- | --- |
| `src/routes/_authenticated.dashboard.tsx` (l. 95) | Últimos ativos cadastrados |
| `src/components/assets-list-page.tsx` (l. 265) | Listagem de ativos |
| `src/routes/_authenticated.administracao.tsx` (l. 185) | Usuários cadastrados |
| `src/routes/_authenticated.relatorios.tsx` (l. 161) | Ativos do relatório |

As tabelas dos gráficos (`assets-status-chart.tsx`, `assets-timeline-chart.tsx`) já possuem `<caption>` — nenhuma alteração.

## Validação
- Playwright em `/login` + verificação DOM: conferir que existe `section[aria-label="Notificações"]` (disparando um toast se necessário) e que ela está dentro do `aside`.
- Para as tabelas: inspeção do DOM renderizado confirmando `table > caption` como primeiro filho, sem mudança visual (classe `sr-only`).

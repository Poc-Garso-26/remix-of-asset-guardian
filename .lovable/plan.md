## Objetivo
Rodar varredura automatizada com Playwright + axe-core no preview local e auditar por código os itens 6 (toasts), 7 (ConfirmDialog) e 8 (CepInput). Aplicar apenas correções pontuais para não-conformidades encontradas nesses três itens.

## Etapa 1 — Varredura automatizada (axe-core via Playwright)

Script em `/tmp/browser/axe/run.py` que:
1. Restaura a sessão Supabase injetada (`LOVABLE_BROWSER_AUTH_STATUS`) para acessar rotas autenticadas.
2. Percorre as rotas principais: `/login`, `/dashboard`, `/ativos`, `/ativos/computadores`, `/ativos/notebooks`, `/ativos/impressoras`, `/ativos/novo`, `/relatorios`, `/administracao`, `/perfil`.
3. Em cada rota injeta `axe-core` via CDN e executa `axe.run` com tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`.
4. Consolida violações por rota (id, impacto, nós afetados) em `/tmp/browser/axe/report.json` + resumo textual.
5. Captura screenshot de cada rota para referência visual.

Se `LOVABLE_BROWSER_AUTH_STATUS` não estiver `injected`, varrer apenas `/login` e reportar limitação.

## Etapa 2 — Auditoria por código

**Item 6 — Toasts (sonner):** revisar `src/routes/__root.tsx` e `src/components/ui/sonner.tsx`. Já verificado: `<Toaster richColors position="top-right" />` sem props que desativem `aria-live`; wrapper apenas customiza classes. Conforme — nada a corrigir.

**Item 7 — ConfirmDialog:** `src/components/confirm-dialog.tsx` usa Radix `AlertDialog`, que gerencia retorno de foco ao gatilho automaticamente. Chamadas em `assets-list-page.tsx`, `administracao.tsx`, `edit-user-role-dialog.tsx` e `ativos.$id.index.tsx` são controladas por estado (`open`/`onOpenChange`) — Radix devolve o foco ao trigger sempre que o open toggler for um botão focado antes. Conforme — nada a corrigir.

**Item 8 — CepInput:** `src/components/cep-input.tsx` usa apenas `aria-busy` no input para loading e um `<span>` estático para erro. Não anuncia carregamento nem erro em região viva. Não conforme — corrigir.

## Etapa 3 — Correção pontual (apenas se confirmada)

Em `src/components/cep-input.tsx`:
- Adicionar região `role="status" aria-live="polite"` (visualmente `sr-only`) com texto "Consultando CEP…" enquanto `loading === true`.
- Trocar o `<span>` de erro por elemento com `role="alert"` (mantendo classes de estilo).
- Associar o erro ao input via `aria-describedby` apontando para o id do elemento de erro (gerado com `useId`).

Nenhuma outra alteração no componente ou nos consumidores.

## Etapa 4 — Relatório final
Entregar ao usuário:
- Resumo do axe por rota (violações críticas/sérias, com id da regra e seletor).
- Status dos itens 6, 7, 8 (conforme / corrigido) com arquivos alterados.
- Recomendações remanescentes que só podem ser validadas manualmente (leitor de tela).

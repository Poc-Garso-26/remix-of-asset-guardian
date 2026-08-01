# Bloco G-6 — Foco no conteúdo principal + evidências de teclado

## Resultado da verificação (já feita)

- `scroll-padding-top: 5rem` (80px) confirmado no navegador: o ajuste do Bloco NBR-2 continua ativo após a atualização do TanStack.
- Skip link em `/login`: primeiro Tab foca "Pular para conteúdo principal"; Enter faz o Tab seguinte cair no campo Email dentro do `<main>`.
- Itens 1 (foco não obscurecido na listagem) e 3 ("Ver todos") não puderam ser abertos no sandbox: o projeto usa Supabase externo não gerenciado, sem sessão disponível aqui.

## Correção a aplicar

Único ponto real encontrado: `<main id="main">` não é focável, então ativar o skip link move a rolagem mas não o foco — leitores de tela não anunciam a chegada ao conteúdo.

- `src/components/app-shell.tsx`: adicionar `tabIndex={-1}` ao `<main id="main">` (e `focus:outline-none` para não desenhar contorno em toda a região).
- `src/routes/login.tsx`: mesmo ajuste no `<main id="main">`.

Sem mudança visual: `tabIndex={-1}` não entra na ordem de tabulação, apenas permite foco programático via `#main`.

## Evidências de teclado

Como não há sessão autenticada no sandbox, as capturas serão produzidas assim:

1. Sequência de screenshots em `/login` mostrando: Tab 1 (skip link visível), pós-Enter (foco em `<main>`), Tab seguinte (campo Email) — com `document.activeElement` impresso em cada passo.
2. Para os itens 1 e 3 (rotas autenticadas), será gerado um roteiro curto de conferência manual com os comandos de console a executar em cada passo (`document.activeElement`, `getBoundingClientRect().top` comparado à altura do header), para você capturar no seu ambiente autenticado. Se preferir, você pode enviar screenshots/vídeo e eu analiso o comportamento observado.

## Arquivos afetados

- `src/components/app-shell.tsx`
- `src/routes/login.tsx`

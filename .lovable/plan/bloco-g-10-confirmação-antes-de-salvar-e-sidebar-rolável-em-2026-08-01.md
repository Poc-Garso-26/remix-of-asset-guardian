# Bloco G-10 — Confirmação antes de salvar e sidebar rolável em zoom alto

## Item 1 — Modal de confirmação antes de gravar o ativo

Hoje o `<form>` de `src/components/asset-form.tsx` chama `onSubmit` direto após a
validação Zod, então criação e edição gravam no banco sem etapa de revisão.

Correção, feita apenas no formulário de ativo (exclusão continua com seu próprio
fluxo):

- Estado local `pending: AssetFormValues | null` no `AssetForm`.
- `form.handleSubmit` passa a apenas guardar os valores validados em `pending`
  (a validação, o resumo de erros e o foco no primeiro erro seguem iguais).
- `ConfirmDialog` (`src/components/confirm-dialog.tsx`, o mesmo da exclusão)
  aberto quando `pending !== null`:
  - título: `Confirmar as alterações no ativo <PATRIMÔNIO>?` (patrimônio vem do
    valor digitado; se vazio, usa o texto genérico "este ativo")
  - descrição: resumo curto lembrando que a gravação é definitiva e não há desfazer
  - `confirmLabel="Confirmar"`, `cancelLabel="Revisar"`
  - "Revisar" só fecha (`pending = null`) — nenhum campo é limpo, o formulário
    permanece exatamente como estava
  - "Confirmar" fecha a modal e chama `await onSubmit(pending)`
- O spinner/estado de envio passa a ser controlado por um `saving` local (já que
  `formState.isSubmitting` termina antes da confirmação), mantendo o botão
  desabilitado durante a gravação.

Como as duas telas (`/ativos/novo` e `/ativos/:id/editar`) usam o mesmo
`AssetForm`, a confirmação vale para criação e edição sem mudanças nas rotas.

## Item 2 — Sidebar sem rolagem própria a partir de ~175% de zoom

O `<aside id="app-sidebar">` em `src/components/app-shell.tsx` é
`fixed inset-y-0 ... lg:static`, sem `overflow`. Quando o menu fica mais alto que
a viewport (zoom alto), o excedente não é alcançável: a rolagem acontece no
conteúdo principal.

Correção (só layout/CSS):

- `aside`: virar coluna flex com altura limitada à viewport
  (`flex flex-col`, `h-dvh`, e no desktop `lg:sticky lg:top-0 lg:h-dvh`).
- Cabeçalho do logo: `shrink-0` para não comprimir.
- `<nav>`: `flex-1 overflow-y-auto overscroll-contain`, ganhando rolagem própria
  apenas quando necessário.

Isso preserva o comportamento atual em zoom normal, o modo recolhido (`lg:w-16`)
e o drawer mobile.

## Validação

- Playwright no preview: `/login` renderiza; as telas de ativos exigem sessão
  autenticada, então a confirmação será validada por render server-side do
  `AssetForm` (submit → modal com título e botões "Confirmar"/"Revisar") e o
  sidebar por um snapshot de `/dashboard` autenticado se a sessão estiver
  disponível no sandbox; caso não esteja, informo exatamente o roteiro manual.
- Checagem de tipos com `tsgo`.
- Roteiro manual (se a sessão não estiver disponível): abrir `/ativos/novo`,
  salvar → conferir a modal, clicar "Revisar" e verificar que os campos
  continuam preenchidos; depois "Confirmar" e verificar o toast/gravação. Em
  `/dashboard` com zoom 175% e 200%, rolar o menu lateral e alcançar "Sair".

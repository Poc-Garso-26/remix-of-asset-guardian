# Bloco C — Acessibilidade (itens 10, 11, 12, 13, 17)

Aplicação sequencial, um item por vez, pausando após cada um para validação. Sem mudanças visuais — apenas atributos ARIA e estrutura semântica.

## Item 10 — Erros de formulário associados ao input (asset-form.tsx)

**Arquivo:** `src/components/asset-form.tsx` (helper `Field`)

- Gerar `errorId` (derivado de `childId` + sufixo `-error`) quando `error` existir.
- Injetar via `cloneElement` no filho: `aria-invalid={!!error}` e `aria-describedby={errorId}` (preservando qualquer `aria-describedby` pré-existente).
- No `<span>` da mensagem: adicionar `id={errorId}` e `role="alert"`.

## Item 11 — Erro global de login/cadastro anunciado

**Arquivos:**
- `src/routes/login.tsx` — container `errors.form` (ou equivalente do bloco de erro geral).
- `src/components/register-user-form.tsx` — `<div>` de `errors.form`.

Adicionar `role="alert"` e `aria-live="assertive"` no container de erro em ambos.

## Item 12 — Estados de carregamento anunciados

**Arquivos:**
- `src/routes/_authenticated.dashboard.tsx`
- `src/components/assets-list-page.tsx`
- `src/routes/_authenticated.administracao.tsx`

Nos containers/tabelas que exibem "Carregando…": aplicar `aria-busy={isLoading}` e `aria-live="polite"` no wrapper apropriado (tbody/section que troca de conteúdo).

## Item 13 — Campos obrigatórios com indicação acessível

**Arquivo:** `src/components/asset-form.tsx`

- Adicionar prop opcional `required?: boolean` ao `Field`.
- No `<label>`: renderizar sufixo `*` com `aria-hidden="true"` quando `required`.
- Injetar `aria-required="true"` (e `required` quando o elemento suportar) no filho via `cloneElement`.
- Marcar `required` em todos os campos que o schema Zod exige: `type`, `patrimony`, `serialNumber`, `brand`, `model`, `status`, `sector`, `responsible`, `location`, `acquisitionDate`.

## Item 17 — `<select>` de filtros com label associado

**Arquivos:**
- `src/components/assets-list-page.tsx` — selects da toolbar de filtros (tipo/situação).
- `src/routes/_authenticated.administracao.tsx` — select(s) de perfil/filtros.

Envolver cada `<select>` num wrapper com `<label className="sr-only" htmlFor={id}>` + `id` no select (usando `useId()`), seguindo o padrão do `FilterInput` do Bloco B. Alternativa equivalente: `aria-label` direto no select quando não houver espaço para wrapper.

## Regras

- Sem mudanças de estilo/layout/classes visuais.
- Pausa após cada item com relatório do que mudou e onde.
- Resumo consolidado ao final dos 5 itens.

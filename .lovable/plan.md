# Bloco G-9 — Legenda de campos obrigatórios e agrupamento semântico

Duas correções estruturais no formulário de ativos (usado em Cadastrar e Editar). Nenhuma mudança visual pretendida.

## Item 1 — Legenda "* Campo obrigatório"

Adicionar, no topo do formulário (acima da primeira seção, junto ao resumo de erros), um texto visível curto:

```
* Campo obrigatório
```

- O `*` usa o mesmo token de cor dos asteriscos dos rótulos (`text-destructive`), o texto usa `text-xs text-muted-foreground`.
- Complementa o `aria-required` já aplicado nos campos; nenhum comportamento de validação muda.

## Item 2 — Agrupamento com fieldset/legend

O componente interno `Section` hoje renderiza:

```text
<section> <header> <h2>Título</h2> <p>Descrição</p> </header> <div grid> campos </div> </section>
```

Passa a renderizar:

```text
<fieldset> <legend> <h2>Título</h2> <p id="...-desc">Descrição</p> </legend> <div grid> campos </div> </fieldset>
```

- `legend` recebe classes de reset (`float-none`, `p-0`, `m-0`, `w-full`, `block`, `mb-4`) para neutralizar o estilo nativo do navegador e manter o espaçamento atual.
- `fieldset` mantém exatamente as classes atuais da `section` (`rounded-xl border border-border bg-card p-5`) com `min-w-0` para evitar o comportamento de largura mínima nativo do fieldset.
- A descrição da seção recebe um `id` gerado por `useId()` e o `fieldset` aponta para ele via `aria-describedby`, para que o contexto complementar seja anunciado ao entrar no grupo.
- Os títulos permanecem como `<h2>` dentro do `legend`, preservando a hierarquia de headings já corrigida em blocos anteriores.

## Arquivo alterado

- `src/components/asset-form.tsx` (único arquivo; afeta `/ativos/novo` e `/ativos/$id/editar`).

## Validação

- Inspeção do DOM via navegador real (Playwright) confirmando `FIELDSET`/`LEGEND` presentes, `aria-describedby` resolvendo para o texto da descrição e a legenda "* Campo obrigatório" visível.
- Comparação de screenshots antes/depois do formulário para confirmar que o visual não mudou.
- Typecheck limpo.

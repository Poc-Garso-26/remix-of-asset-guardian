# Correção G-9.1 — Legend nativa recortando a borda do fieldset

O componente `Section` (usado por todas as seções: Identificação, Alocação, Especificações técnicas, Especificações da impressora, Observações) renderiza o título dentro de um `<legend>` com classes de reset. O `<legend>` continua participando do mecanismo nativo de layout do `<fieldset>`, que abre um "buraco" na borda superior.

## Abordagem escolhida

Opção 1 — `display: contents` na `<legend>`, com uma `<div>` interna para o conteúdo visual.

Motivo: `display: contents` remove por completo o tratamento especial da legend, então a borda do fieldset volta a ser contínua e o título passa a fluir como um cabeçalho normal dentro da caixa — restaurando exatamente o visual anterior ao G-9 — sem perder o nome acessível do grupo (a legend continua existindo no DOM com o `<h2>` dentro).

Se o navegador de teste ainda mostrar recorte com `display: contents`, cai-se para a Opção 2 (`<legend className="sr-only">{title}</legend>` + cabeçalho visual separado dentro do fieldset).

## Mudança

Em `Section`, dentro de `src/components/asset-form.tsx`:

```text
<fieldset class="min-w-0 rounded-xl border border-border bg-card p-5" aria-describedby=...>
  <legend class="contents">          <!-- sem float/margin/padding próprios -->
    <div class="mb-4">
      <h2 class="text-sm font-semibold">Título</h2>
      <p id=descId class="text-xs text-muted-foreground">Descrição</p>
    </div>
  </legend>
  <div class="grid ...">campos</div>
</fieldset>
```

- Remove as classes `float-none m-0 mb-4 block w-full p-0` da legend e aplica `contents` (utilitário Tailwind para `display: contents`).
- O espaçamento `mb-4` migra para a `<div>` interna, preservando o gap atual entre cabeçalho e campos.
- Semântica de agrupamento (`fieldset`), nome acessível (`legend`) e `aria-describedby` permanecem inalterados.

Como `Section` é o único ponto de renderização, a correção vale para todas as seções automaticamente.

## Validação

- Playwright no formulário (`/ativos/novo`) com screenshot da seção "Identificação" e da caixa completa, confirmando borda superior contínua, sem recorte, e título em negrito dentro da caixa.
- Inspeção do DOM confirmando `FIELDSET`/`LEGEND` ainda presentes e `aria-describedby` resolvendo para a descrição.
- Typecheck limpo.

## Arquivo alterado

- `src/components/asset-form.tsx`

# Corrigir os 2 achados de gravidade Média

## Item 1 — Hydration mismatch no `<head>` (`src/routes/__root.tsx`)

**Alteração:** adicionar `suppressHydrationWarning` no `<head>` e no `<script>` inline do tema em `RootShell` (linhas 105–106). Isso silencia o mismatch causado pelo atributo `data-tsd-source` (injetado pelo instrumentador de source-tracking do Lovable), que reporta números de linha diferentes entre SSR e cliente.

Antes:
```tsx
<head>
  <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
  <HeadContent />
</head>
```

Depois:
```tsx
<head suppressHydrationWarning>
  <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeInitScript }} />
  <HeadContent />
</head>
```

Sem impacto visual, funcional ou de SEO. Apenas remove o warning do console.

## Item 2 — Warning `vite-tsconfig-paths` (`vite.config.ts`)

**Análise após inspeção do arquivo:** o `vite.config.ts` do projeto usa `@lovable.dev/vite-tanstack-config`, cujo comentário no topo declara explicitamente que o plugin `tsConfigPaths` já é incluído internamente e **não** deve ser adicionado manualmente. Ou seja, o warning é emitido pelo wrapper da Lovable, não por código do projeto.

**Ação:** **nenhuma alteração no código do projeto.** Corrigir esse warning exige atualização do pacote upstream `@lovable.dev/vite-tanstack-config` para migrar de `vite-tsconfig-paths` (plugin) para `resolve.tsconfigPaths: true` (nativo do Vite 8). Fica registrado como pendência de upstream — sem impacto funcional.

## Verificação

Após aplicar o Item 1: recarregar a página `/login`, abrir o console e confirmar que a mensagem "A tree hydrated but some attributes of the server rendered HTML didn't match…" com o diff de `data-tsd-source` não aparece mais.

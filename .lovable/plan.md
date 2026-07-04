# Correções de inconsistências

Após revisão do código e dos logs, foi identificada 1 inconsistência real; o restante da aplicação está saudável.

## 1. Hydration mismatch no `<html>` (erro no console)

**Sintoma** (console):
```
A tree hydrated but some attributes of the server rendered HTML didn't match…
<html> … + (server) sem class  … − (client) className="dark" data-theme="dark"
```

**Causa:** `src/routes/__root.tsx` renderiza `<html lang="en">` no servidor. Antes da hidratação, `themeInitScript` (injetado no `<head>` para evitar FOUC) adiciona `class="dark"` e `data-theme="dark"` no `<html>`. React compara e reclama. É esperado — o script existe justamente para mutar o DOM antes do React — mas precisa ser silenciado.

**Correção:** adicionar `suppressHydrationWarning` no `<html>` (e no `<body>`, por segurança, já que extensões costumam mutá-lo).

```tsx
<html lang="en" suppressHydrationWarning>
  …
  <body suppressHydrationWarning>
```

Nenhuma outra alteração: o script FOUC continua funcionando, temas continuam iguais.

## Itens verificados e OK

- Rotas `_authenticated/*` protegidas pelo layout gerenciado, sem duplicação de gate.
- `assetsService` — sem regressões após adição de `statusDistribution()`.
- Novo card do dashboard renderiza corretamente (confirmado no session replay).
- Sem chamadas de servidor privilegiadas expostas.

## Fora de escopo

- Sem alterações em UI, dados, RLS, migrations ou dependências.

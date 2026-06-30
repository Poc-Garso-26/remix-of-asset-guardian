## Diagnóstico

Verifiquei o estado atual do projeto:

- **Dev server Vite**: rodando normal em `:8080`, sem erros.
- **Typecheck (`tsgo --noEmit`)**: passa sem erros.
- **Rota `/ativos`**: responde corretamente (HTTP 307 → redireciona para `/auth` quando não autenticado, comportamento esperado pelo gate `_authenticated`).
- **Logs do Vite**: apenas 3 *warnings* de depreciação — `createServerFn().inputValidator()` deve passar a se chamar `.validator()`. Não são erros, não quebram o build.

O aviso anterior **"Preview has not been built yet"** foi transitório: ocorre enquanto o Vite recompila após uma edição (o filtro de QR Code adicionado na rodada anterior). Após a recompilação concluir, a tela volta ao normal — o que já aconteceu. Não há nada quebrado no código.

## Plano

Como não há erro real para corrigir, o escopo é apenas **higiene** para remover os 3 warnings do log e evitar que apareçam como "ruído" em futuras compilações:

### `src/lib/users-status.functions.ts`
- Renomear `.inputValidator(` → `.validator(` (1 ocorrência, linha 11).

### `src/lib/users-admin.functions.ts`
- Renomear `.inputValidator(` → `.validator(` (2 ocorrências, linhas 28 e 64).

Nenhuma alteração de comportamento, schema, RLS, rotas, UI ou da tela `/ativos`. Apenas substituição do nome do método deprecado pela API atual do TanStack Start.

### Verificação após aplicar
1. Aguardar o Vite recompilar.
2. Conferir que os logs do dev server não exibem mais o warning `inputValidator() is deprecated`.
3. Abrir `/ativos` no preview e validar que a listagem (incluindo o filtro "QR Code") continua funcional.

### Fora de escopo
- Mudanças em `assets-list-page.tsx`, `assets-service.ts`, schema, edge functions, auth ou roteamento.
- Reinício manual do dev server (não é necessário).

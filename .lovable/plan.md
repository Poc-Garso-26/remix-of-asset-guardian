# Auditoria de Logs & Saúde da Aplicação (somente diagnóstico)

Escopo: console do navegador, logs do Vite (dev-server), logs de autenticação Supabase, network requests, arquivos-chave do bootstrap. Nenhuma alteração será feita.

## Achados

| Gravidade | Arquivo | Erro / Sintoma | Causa | Solução | Correção automática | Risco |
|---|---|---|---|---|---|---|
| Médio | `src/routes/__root.tsx` (linhas 102–108) | Hydration mismatch: `data-tsd-source` diverge entre SSR (`105:7`) e cliente (`102:7`) no `<head>` e no `<script>` do tema | O plugin de "source tracking" (`data-tsd-source`) injeta atributos com números de linha diferentes entre a árvore SSR e a compilada no cliente. Fica visível porque o `<head>` não está marcado com `suppressHydrationWarning` (apenas `<html>` e `<body>` estão) | Adicionar `suppressHydrationWarning` no `<head>` e no `<script>` inline do tema, ou desabilitar o instrumentador `data-tsd-source` em produção/preview | Sim | Baixo |
| Médio | `vite.config.ts` | Warning na inicialização do Vite: *"The plugin `vite-tsconfig-paths` is detected. Vite now supports tsconfig paths resolution natively via `resolve.tsconfigPaths`"* | Plugin redundante — Vite 8 resolve paths do tsconfig nativamente | Remover `vite-tsconfig-paths` do `plugins` e habilitar `resolve.tsconfigPaths: true` | Sim | Baixo |
| Baixo | `src/lib/auth.tsx` (`useEffect`, hydrate + `onAuthStateChange`) | Potencial doble-fetch de profile/roles em `INITIAL_SESSION` + `getSession()` | `onAuthStateChange` dispara `INITIAL_SESSION` no mount, e `getSession()` também roda no mesmo effect — ambos chamam `hydrate` | Filtrar eventos (`SIGNED_IN`/`SIGNED_OUT`/`USER_UPDATED`) no listener, como recomenda a integração TanStack+Supabase | Sim | Baixo |
| Baixo | `src/lib/auth.tsx` (linhas ~120–128) | `setTimeout(..., 0)` dentro do callback do `onAuthStateChange` | Padrão antigo para escapar do "callback lock" do Supabase; hoje desnecessário e dificulta cancelamento (não é limpo no unmount) | Substituir por `queueMicrotask` ou chamar direto após checagem `mounted` | Sim | Baixo |
| Baixo | `src/integrations/supabase/auth-attacher.ts` | `supabase.auth.getSession()` executado em toda chamada de server function | Custo pequeno, mas gera IO em `localStorage` a cada RPC | Cachear o token na sessão em memória ou usar middleware específico que leia da store do AuthProvider | Não | Médio |
| Baixo | `src/lib/users-admin.functions.ts` (`ensureAdmin` — parâmetro tipado como `never`/objeto adhoc) | Uso de `as never` no cast de `context.supabase` | Contorna a inferência de tipos da middleware; pode mascarar mudanças de contrato futuras | Tipar `SupabaseClient<Database>` corretamente na assinatura | Sim | Baixo |
| Baixo | `src/lib/users-admin.functions.ts` (createUserAsAdmin) | Após `auth.admin.createUser`, o insert em `user_roles` roda sem tratamento explícito de erro (só quando `role !== 'usuario'`) | Se o insert falhar (RLS/duplicidade), a criação do usuário no Auth persiste sem role — estado inconsistente | Envolver em transação lógica: em erro do insert, rollback via `auth.admin.deleteUser`, ou tratar e retornar erro claro | Não | Médio |
| Baixo | `src/lib/users-service.ts` (`listManagedUsers`) | Duas queries paralelas (`profiles` + `user_roles`) mescladas em memória; sem paginação | Para volumes grandes de usuários (>1000) atinge o limite default do PostgREST | Adicionar `.range()` e paginação server-side ou view SQL com join | Não | Médio |
| Baixo | `src/routes/__root.tsx` | `AuthProvider` envolve toda a árvore, mas apenas rotas `_authenticated` precisam dele. `ThemeProvider` OK | Sem impacto funcional, apenas escopo mais amplo do necessário | Manter — refatoração opcional | Não | Baixo |
| Informativo | `supabase/config.toml` / Auth | Leaked-password protection já foi habilitado no bloco anterior de segurança; conferir se `HaveIBeenPwned` está ativo no dashboard | — | Verificar no painel Supabase Auth > Policies | Não | Baixo |
| Informativo | Console | Nenhum erro de runtime além do hydration mismatch nos últimos logs (janela curta desde `2026-07-09T00:06:55Z`) | — | Monitorar após correção do item 1 | — | — |
| Informativo | Network | Snapshot atual sem requests com erro | — | Reexecutar auditoria após navegação real autenticada | — | — |
| Informativo | Auth logs | Único evento recente: `logout` com HTTP 204 (esperado) | — | — | — | — |

## Pontos de atenção preventivos

- **SSR × `localStorage`**: `AuthProvider` roda no cliente; ok, porém há chamada `supabase.auth.getSession()` no mount. Confirmar que nenhum loader público chama server fn com `requireSupabaseAuth` (validado em `_authenticated` layout).
- **Realtime**: nenhum canal encontrado nos arquivos amostrados. Se for adicionado, seguir o padrão `useEffect` + `removeChannel`.
- **Edge Functions** (`generate-asset-qrcode`, `delete-asset-qrcode`): não inspecionadas em profundidade. Recomenda-se auditar logs específicos após uso real (bucket `asset-qrcodes` está privado — verificar signed URLs).
- **`console.error` em `role-audit` (`users-admin.functions.ts`)**: falha de auditoria é apenas logada; considerar métrica/alerta.
- **Performance**: consultas em `listManagedUsers` fazem `select *` implícito em `user_roles` — hoje pequeno, futuramente adicionar índice `(user_id)` (provavelmente já existe via UNIQUE).

## Resumo executivo

- Erros **críticos**: 0
- Erros **altos**: 0
- Erros **médios**: 2 (hydration mismatch no `<head>`; warning do plugin Vite)
- Erros **baixos**: 6
- **Warnings**: 1 explícito (vite-tsconfig-paths) + 1 React (hydration)
- **Melhorias sugeridas**: 8

### Nota de saúde: **8,5 / 10**

Justificativa: aplicação estável, sem erros críticos ou de runtime bloqueantes na janela analisada; autenticação e RLS bem estruturados (roles em tabela separada, `has_role` SECURITY DEFINER, middleware validando JWT). Os pontos que impedem nota 10 são: (1) hydration mismatch reportado pelo React no `<head>` — visível em produção, poluindo console e podendo mascarar futuros mismatches; (2) plugin obsoleto no Vite; (3) padrões subótimos no `AuthProvider` (double-fetch potencial, `setTimeout(0)`); (4) ausência de rollback no fluxo `createUserAsAdmin`. Todos são corrigíveis com baixo risco.

---

**Observação:** este plano é apenas um relatório diagnóstico. Nenhum arquivo será modificado. Para aplicar as correções sugeridas, aprove esta análise e envie um novo pedido indicando quais itens deseja implementar.

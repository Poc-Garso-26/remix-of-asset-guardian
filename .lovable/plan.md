## Objetivo
Bloquear a alteração de perfil quando o usuário estiver com situação **"Inativo"**, exibindo mensagem informativa no diálogo `EditUserRoleDialog`.

## Mudança única
**`src/components/edit-user-role-dialog.tsx`**

1. Derivar `isInactive = user.status === "Inativo"`.
2. Quando `isInactive`:
   - Desabilitar o `<Select>` de "Novo perfil" (prop `disabled`).
   - Desabilitar o botão **Salvar alteração** (junto com a condição `!changed` já existente).
   - Renderizar um aviso informativo logo abaixo do select, no mesmo padrão visual do aviso âmbar já presente (`isDemotingSelfAdmin`), porém usando tons neutros/`muted` para indicar bloqueio — ícone `AlertTriangle` + texto:
     > "Não é possível alterar o perfil de um usuário com situação Inativo. Reative o usuário em /administracao antes de alterar o perfil."
3. Server-side: adicionar guarda equivalente em `setUserRole` (`src/lib/users-admin.functions.ts`) — antes de aplicar a troca, ler `profiles.status` do `userId` alvo via `supabaseAdmin`; se for `"Inativo"`, lançar `Error("Não é possível alterar o perfil de um usuário inativo.")`. Garante que a regra valha mesmo se o cliente for contornado.

## Não alterado
- Sem mudanças em RLS, schema, hooks, listagem, fluxo de ativar/inativar, ou tela `/perfil`.
- Sem novos componentes ou arquivos.
- Não altera o comportamento para usuários `Ativo` — fluxo atual segue idêntico.

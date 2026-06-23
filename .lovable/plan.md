## Gerenciamento de perfis de usuário

Adicionar edição de perfil (role) na tela `/administracao`, restrita a administradores, com auditoria e proteção do último admin.

### Banco de dados (migração)

1. **Tabela `public.role_audit_log`** — registro de alterações:
   - `target_user_id` (uuid), `previous_role` (app_role, nullable), `new_role` (app_role)
   - `changed_by` (uuid), `created_at` (timestamptz default now())
   - GRANT SELECT/INSERT para `authenticated`, ALL para `service_role`
   - RLS habilitada; policy SELECT: `public.has_role(auth.uid(), 'admin')`; INSERT somente via service_role (server function)

2. **Função `public.count_active_admins()`** — `security definer`, retorna número de admins ativos (join `user_roles` + `profiles.active = true`). Usada na validação de "último admin".

### Server function (`src/lib/users-admin.functions.ts`)

Substituir/ampliar o `setUserRole` existente:
- Middleware `requireSupabaseAuth` + checagem `has_role(admin)` do chamador.
- Buscar role atual do alvo (maior na hierarquia).
- Se role atual = `admin` e novo role ≠ `admin`: chamar `count_active_admins()`; bloquear se = 1 e o alvo for o único admin ativo (erro claro: "Não é possível remover o último administrador ativo").
- Em transação lógica (via `supabaseAdmin`):
  - DELETE roles do `user_id`
  - INSERT novo role (sempre, inclusive `usuario`, para consistência)
  - INSERT em `role_audit_log` com `previous_role`, `new_role`, `changed_by = context.userId`
- Retornar `{ ok: true, previousRole, newRole }`.

### UI — `src/routes/_authenticated.administracao.tsx`

Acrescentar coluna **Ações** na tabela com botão "Editar perfil" (ícone `Pencil`) por linha.

Novo componente `EditUserRoleDialog` (`src/components/edit-user-role-dialog.tsx`):
- Dialog do shadcn com:
  - Resumo do usuário (nome, e-mail, perfil atual badge)
  - `<Select>` com opções: Administrador / Gestor / Usuário Padrão (rótulos via `roleLabel`)
  - Mensagem de validação inline (ex.: tentativa de rebaixar último admin)
  - Botões Cancelar / Salvar
- Ao salvar, abrir `ConfirmDialog` ("Confirmar alteração de perfil de X para Y?") antes de chamar a server function.
- `useMutation` → `useServerFn(setUserRole)`:
  - onSuccess: `toast.success("Perfil atualizado com sucesso")`, `queryClient.invalidateQueries(["managed-users"])`, fechar dialog.
  - onError: `toast.error(error.message)` (mensagens já vêm em PT).

Self-demotion: permitir, mas o backend bloqueia se for o último admin; o front mostra aviso visual quando `targetUserId === currentUser.id && currentRole === 'admin'`.

### Permissões imediatas

`src/lib/auth.tsx` já deriva permissões do JWT/role do contexto Supabase. Após alteração:
- Se o admin alterou o próprio role, chamar `supabase.auth.refreshSession()` para recarregar claims; caso contrário, invalidar query de usuários é suficiente (o alvo verá a mudança no próximo carregamento da sessão dele).

### Detalhes técnicos

- Arquivos novos: `src/components/edit-user-role-dialog.tsx`, migração SQL com `role_audit_log` + `count_active_admins`.
- Arquivos editados: `src/lib/users-admin.functions.ts` (lógica de auditoria e guarda do último admin), `src/routes/_authenticated.administracao.tsx` (coluna Ações + integração do dialog).
- Reutiliza `ConfirmDialog`, `Dialog`, `Select`, `Button`, `sonner` (toast) já existentes.
- Mantém o padrão visual atual (cards, badges `bg-accent`, tipografia `font-display`).

### Critérios de aceitação cobertos

- Admin vê todos os usuários ✔ (já existente, com nova coluna Ações)
- Admin altera perfil de outro usuário via dropdown + confirmação ✔
- Não-admin não acessa (`can("user.manage")` + checagem no server) ✔
- Auditoria persistida em `role_audit_log` ✔
- Último admin protegido pelo backend ✔
- Permissões atualizadas imediatamente (invalidação + refresh de sessão quando aplicável) ✔

# Correção de segurança: proteger status/active em profiles

## Situação confirmada

Consultei o banco antes de planejar:

- `has_column_privilege('authenticated','public.profiles','status','UPDATE')` = **true** e o mesmo para `active` — o REVOKE por coluna da migration `20260707215722` realmente não teve efeito (existem 2 ACLs de coluna, mas o GRANT de tabela inteira prevalece).
- ACL das tabelas `profiles`, `user_roles` e `role_audit_log`: **anon, authenticated e service_role todos com `arwdDxtm`** (todos os privilégios), protegidos apenas por RLS.

## O que será feito (uma nova migration, sem editar as existentes)

### 1. Trigger de guarda em `profiles`

Nova função `public.guard_profile_status_change()` + trigger `BEFORE UPDATE ON public.profiles`:

- Se `status` ou `active` mudarem em relação ao valor salvo, a alteração só é aceita quando:
  - a operação vem de um contexto privilegiado (`service_role`, `postgres`, `supabase_admin`, `supabase_auth_admin` — é assim que a tela de Administração grava, via server function com cliente admin), **ou**
  - `public.has_role(auth.uid(), 'admin')` é verdadeiro.
- Caso contrário: `RAISE EXCEPTION` com mensagem clara ("Somente administradores podem alterar a situação de um usuário."), rejeitando a operação inteira — inclusive chamadas diretas à API REST.
- Alterações em outros campos (nome, username, e-mail, last_login) seguem funcionando para o próprio usuário, como hoje.
- O trigger existente `sync_profile_active_with_status` é preservado; o guard será nomeado para rodar depois dele, de modo que compare o estado final contra o salvo.

### 2. Redução de privilégios da role `anon`

`REVOKE ALL` de `anon` em `profiles`, `user_roles` e `role_audit_log`. Nenhuma política de RLS dessas tabelas concede acesso a `anon` hoje, então isso é defesa em profundidade sem impacto funcional. `authenticated` e `service_role` mantêm os privilégios atuais (a proteção de `status`/`active` passa a vir do trigger, que não pode ser contornado por grants).

### 3. Testes

- Simular usuário comum via `SET LOCAL role authenticated` + `request.jwt.claims` de um usuário sem papel admin, tentar `UPDATE profiles SET status='Ativo'` → deve falhar com a exceção.
- Simular admin da mesma forma → deve passar.
- Rodar um update em nome de contexto privilegiado (caminho real da tela de Administração) → deve passar.
- Verificar que um update apenas de `nome` pelo próprio usuário continua funcionando.
- Conferir `count_active_admins()` após os testes e reverter quaisquer dados alterados no teste.

Nada muda no código da aplicação: `setUserStatus` já roda com cliente admin e checagem `has_role(admin)`. O item de HTTP 500 vs 401 fica fora deste escopo, como solicitado.

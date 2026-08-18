# Mapeamento: substituição do Supabase Auth pelo Acesso PBH (OIDC/Keycloak)

Levantamento apenas. Nada foi alterado.

## 1. Fluxo de autenticação atual

| Ponto | Arquivo | Papel |
|---|---|---|
| Contexto/hook de sessão | `src/lib/auth.tsx` | `AuthProvider` + `useAuth()`; `login()` chama `supabase.auth.signInWithPassword`, `logout()` chama `signOut`, `onAuthStateChange` + `getSession()` hidratam a sessão, `loadUser()` lê `profiles` e `user_roles` |
| Tela de login | `src/routes/login.tsx` | formulário e-mail/senha (`email`, `password`) → `login()` → `navigate("/dashboard")` |
| Gate de rotas | `src/routes/_authenticated.tsx` | usa `isAuthenticated`/`isLoading` do `useAuth`, com `<Navigate to="/login">` |
| Cliente browser | `src/integrations/supabase/client.ts` | sessão persistida em `localStorage`, autorefresh |
| Bearer nas server fns | `src/integrations/supabase/auth-attacher.ts` + `src/start.ts` | pega `access_token` do Supabase e injeta `Authorization: Bearer` |
| Validação server-side | `src/integrations/supabase/auth-middleware.ts` (`requireSupabaseAuth`) | exige header `Bearer`, valida o token no Supabase e injeta `supabase`, `userId`, `claims` |
| Consumidores de `context.userId`/`context.supabase` | `src/lib/users-admin.functions.ts` (linhas ~29, 42, 65, 70, 131 — inclui `changed_by`), `src/lib/users-status.functions.ts` | operações administrativas |
| Admin/service role | `src/lib/users-status.functions.ts` usa `supabaseAdmin.auth.admin.updateUserById` (ban/unban) | acoplado ao gerenciamento de usuários do Supabase Auth |
| Criação de usuário | `src/components/register-user-form.tsx` → `supabase.auth.signUp` | acoplado a e-mail/senha |
| Edge Function | `supabase/functions/generate-asset-qrcode/index.ts` | valida o JWT do usuário e chama `has_role` |

## 2. Fontes de verdade de papel/permissão hoje

- Banco: `public.user_roles` (enum `app_role`: admin/gerente/usuario) + `public.has_role(uuid, app_role)` SECURITY DEFINER; `public.profiles` guarda nome/email/username/`status`/`active`; `handle_new_user()` cria profile + papel (`admin` para o primeiro usuário, senão `usuario`).
- Front-end: `PERMISSIONS` (matriz Role→Permission) e `can()` em `src/lib/auth.tsx`; o papel efetivo é derivado em `loadUser()` por precedência admin > gerente > usuario.
- Consumidores de `can()`/papel: `src/components/assets-list-page.tsx` (export, criar, editar, excluir), `src/routes/_authenticated.ativos.$id.index.tsx`, `_authenticated.ativos.novo.tsx`, `_authenticated.relatorios.tsx` (view + export), `_authenticated.administracao.tsx` (`user.manage`, `isAdmin`, contadores por papel), `src/components/edit-user-role-dialog.tsx` (bloqueio de auto-rebaixamento), `src/components/app-shell.tsx` (itens de menu por `permission`).

## 3. Triggers e RLS que dependem de `auth.uid()`

- `guard_profile_status_change()` (trigger `zz_guard_profile_status_change` em `profiles`, migrations `20260811222900` e `20260811223019`): bloqueia mudança de `status`/`active` salvo se `current_user` é papel de serviço ou `has_role(auth.uid(),'admin')`.
- Políticas RLS com `has_role(auth.uid(), ...)`: `assets`, `asset_computer_specs`, `asset_printer_specs`, `locations`, `sectors`, `maintenances`, `movements`, `profiles`, `user_roles`, `role_audit_log`.
- `auth.uid()` é lido do claim `sub` do JWT que o PostgREST recebe. Consequência: **qualquer** abordagem tem de continuar entregando ao Postgres um JWT com `sub` = id do usuário e `role: authenticated`, assinado com chave que o Supabase aceite. Se a identidade passar a vir do Keycloak, é preciso (a) manter um id local estável por usuário PBH e (b) garantir que esse id vá no `sub`. Nada nas policies/trigger precisaria mudar se essa equivalência for preservada; se o `sub` passar a ser o id do Keycloak, será necessário migrar `profiles.user_id`/`user_roles.user_id` para esse identificador (ou introduzir um mapeamento e reescrever todas as policies e o trigger).

## 4. Abordagem A — OIDC dentro do Supabase Auth

Fato verificado: o projeto **não é self-hosted** — `src/integrations/supabase/client.ts` aponta para `https://gkieaxljrlocsuythjqw.supabase.co` (Supabase gerenciado, ref `gkieaxljrlocsuythjqw`). Isso favorece a Abordagem A: o Supabase gerenciado oferece Keycloak como provider OIDC configurável (Auth > Providers), com `sub` e claims mapeados para `auth.users` e `raw_user_meta_data`.

Impacto:
- `src/routes/login.tsx` — trocar formulário por botão único (baixo).
- `src/lib/auth.tsx` — `login()` passa a `signInWithOAuth`/OIDC; rota de callback para hidratar sessão (baixo/médio).
- `handle_new_user()` — passa a ler `raw_user_meta_data` (name, preferred_username, groups) e derivar o papel (médio).
- `src/components/register-user-form.tsx` e `users-status.functions.ts` — provisionamento local deixa de fazer sentido; usuários passam a existir no IdP (médio).
- RLS, `has_role`, trigger, `requireSupabaseAuth`, `auth-attacher`, todo o front-end de permissões: **sem mudança** — o Supabase continua emitindo o JWT.
- Esforço geral: **baixo/médio**.

## 5. Abordagem B — OIDC direto na aplicação

Necessário: rotas de servidor (`/api/public/auth/callback`), verificação de assinatura via JWKS do Keycloak, sessão própria (cookie HttpOnly), e — para preservar RLS — emitir um JWT customizado assinado com o segredo JWT do projeto Supabase, com `sub` = `user_id` local e `role: authenticated`, além de manter/rotacionar refresh.

Impacto: `src/lib/auth.tsx` (reescrita), `login.tsx`, `_authenticated.tsx`, `client.ts` (sessão deixa de ser do Supabase), `auth-attacher.ts` + `start.ts`, `auth-middleware.ts` (validar token próprio), `users-admin.functions.ts`, `users-status.functions.ts` (perde `auth.admin`), `generate-asset-qrcode` (nova validação), sincronização de `profiles`/`user_roles` sem `auth.users`. Esforço: **alto**, com risco de segurança concentrado na emissão do JWT.

## 6. Mapeamento de papéis

Sim: será preciso mapear `groups` (e possivelmente `attributes`/`origem`) do token para admin/gerente/usuario, com fallback para `usuario` e precedência admin > gerente > usuario (a mesma de `loadUser()`).
Recomendação de local: **na fronteira do servidor, uma vez por login** — na Abordagem A, dentro de `handle_new_user()`/uma função de sincronização chamada no primeiro login (a fonte de verdade continua `user_roles`, o que preserva RLS, trigger e `has_role`); na Abordagem B, no callback OIDC (server function) que faz upsert em `user_roles`. Não colocar em Edge Function nem no front-end. Definir também se o papel local pode ser sobrescrito manualmente por admin ou se o IdP é sempre soberano (hoje `edit-user-role-dialog.tsx` permite edição manual).

## 7. Login e experiência do usuário

`login.tsx` perde `email`, `password`, `PasswordInput`, `handleSubmit` e mensagens de erro locais; ganha um botão "Entrar com Acesso PBH" (com estado de carregamento e tratamento de erro do callback). Manter: skip link, `ThemeToggle`, `APP_VERSION_LABEL`, contraste e semântica já validados na auditoria — os testes em `tests/a11y/public-routes.a11y.spec.ts` cobrem `/login` e precisarão ser reavaliados (o teste de `label` deixa de ter campos). Logout deve considerar RP-initiated logout no Keycloak (`end_session_endpoint`), senão o usuário volta a entrar sem digitar credenciais.

## 8. Resumo por área e riscos

- Autenticação: A = baixo/médio; B = alto.
- Autorização/RLS: A ≈ nenhum impacto; B = alto (todo o modelo `auth.uid()` passa a depender de token emitido pela aplicação).
- Front-end: baixo em ambas (só login/logout; `can()` e menus permanecem).
- Migrations necessárias: A = ajuste de `handle_new_user()` + função de mapeamento de grupos; B = idem, mais desacoplamento de `auth.users` e possível remapeamento de `user_id`.
- Riscos: divergência de identificador (`sub`) quebrando policies e trigger; usuários legados sem correspondência no IdP; grupos PBH instáveis ou pouco granulares; perda do `auth.admin` (ativar/inativar usuário); segurança da emissão de JWT (B); sessão/refresh e logout federado; testes de acessibilidade do login.

## 9. Pendências

1. Credenciais e metadados do Acesso PBH: `issuer`/discovery URL, `client_id`/`client_secret`, redirect URIs liberadas, escopos e formato exato de `groups`.
2. Confirmar no painel do projeto (`gkieaxljrlocsuythjqw`) se o provider Keycloak/OIDC está disponível e habilitável no plano atual — não é verificável a partir do código.
3. Política de papéis: IdP soberano ou edição manual permitida; qual grupo PBH corresponde a Administrador e Gerente.
4. Destino dos usuários existentes (migração por e-mail, coexistência temporária dos dois logins, ou corte seco).
5. Se logout deve encerrar a sessão no Acesso PBH (SLO) ou apenas na aplicação.

## Próximo passo

Escolher entre Abordagem A e B (recomendação: A, dado que o projeto usa Supabase gerenciado e A preserva todo o modelo de RLS) e resolver as pendências 1–3 antes de qualquer implementação.

## Objetivo
Exibir a "Situação" (Ativo/Inativo) do usuário autenticado na tela `/perfil`, reutilizando a mesma fonte de dados do módulo `/administracao`.

## Origem dos dados
O módulo administrativo já lê o campo `status` da tabela `profiles` via `listManagedUsers` (em `src/lib/users-service.ts`), retornando `UserStatus = "Ativo" | "Inativo"`. Vou reutilizar esse mesmo tipo e a mesma tabela/campo — sem criar novas estruturas.

## Mudanças

### 1. `src/lib/users-service.ts`
Adicionar um pequeno hook `useCurrentUserStatus()` que consulta `profiles.status` apenas do usuário autenticado:

- Query key: `["profile-status", userId]`
- `supabase.from("profiles").select("status, active").eq("user_id", userId).maybeSingle()`
- Normaliza igual ao `listManagedUsers`: se `status` for `"Ativo"`/`"Inativo"` usa direto; senão, deriva de `active` (fallback). Se não houver registro, retorna `null`.
- Reutiliza o tipo `UserStatus` já exportado.

Justificativa: evita carregar a lista completa de usuários (que exige permissão admin via RLS) só para mostrar o status do próprio usuário no perfil.

### 2. `src/routes/_authenticated.perfil.tsx`
- Importar `useCurrentUserStatus` e o ícone `CheckCircle2`/`XCircle` (mesmo padrão visual usado em `/administracao`).
- Chamar o hook passando `session.user.id`.
- Acrescentar um novo item ao `<dl>` de dados cadastrais (mesmo padrão de `Usuário`/`ID`):
  - `<dt>` "Situação"
  - `<dd>` com badge:
    - `Ativo` → `inline-flex items-center gap-1 ... text-success` + `CheckCircle2`
    - `Inativo` → `... text-destructive` + `XCircle`
    - valor nulo/desconhecido → `—`
- Campo somente leitura, sem ações.

## Não alterado
- Não altera `listManagedUsers`, `/administracao`, RLS, tabelas ou tipos existentes.
- Não cria componentes novos nem arquivos novos.
- Não muda layout/tipografia/espaçamento — usa o mesmo `<dl class="grid ...">` já presente.

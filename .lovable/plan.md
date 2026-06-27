## Objetivo

Permitir que Administradores alternem o status (Ativo/Inativo) de um usuário clicando no texto da coluna "SITUAÇÃO" em `/_authenticated/administracao`, sem qualquer mudança de layout, CSS, ordem de colunas, filtros, paginação ou demais fluxos.

## Mudanças no banco (migração Supabase)

1. Adicionar coluna `status text not null default 'Ativo'` em `public.profiles`.
2. Backfill a partir do booleano existente `active`:
   - `UPDATE public.profiles SET status = CASE WHEN COALESCE(active, true) THEN 'Ativo' ELSE 'Inativo' END;`
3. Constraint: `CHECK (status IN ('Ativo','Inativo'))`.
4. Trigger `BEFORE INSERT OR UPDATE` que mantém `active` sincronizado com `status` (`active = (status = 'Ativo')`) — preserva todo código atual que lê `active` (ex.: `count_active_admins`, `users-service`, badge "Ativo/Inativo" da própria tela).
5. Atualizar `handle_new_user` para também gravar `status = 'Ativo'` (compatível com o default).
6. Não alterar RLS de SELECT. Política de UPDATE já existente em `profiles` é restrita; o toggle será feito via server function com `supabaseAdmin` após verificação de papel — bloqueando qualquer tentativa direta de cliente sem permissão.

## Server function (backend)

Novo arquivo `src/lib/users-status.functions.ts`:

- `setUserStatus` com `createServerFn({ method: "POST" })`
- `.middleware([requireSupabaseAuth])`
- `inputValidator` com `z.object({ userId: z.string().uuid(), status: z.enum(["Ativo","Inativo"]) })`
- Handler:
  1. `ensureAdmin` via `context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" })` — espelhando o padrão de `users-admin.functions.ts`.
  2. Proteção do último administrador ativo: se alvo é admin e novo status é `Inativo`, validar com `count_active_admins` (>1) antes de inativar.
  3. `await import("@/integrations/supabase/client.server")` e `supabaseAdmin.from("profiles").update({ status }).eq("user_id", userId)`.
  4. Retornar `{ ok: true, status }`.

Segurança: usuários sem perfil admin recebem erro do middleware (sem sessão) ou do `ensureAdmin` (sem permissão) — bloqueando chamadas diretas via navegador/API.

## Camada de serviço (frontend)

`src/lib/users-service.ts`:

- Adicionar `status: "Ativo" | "Inativo"` em `ManagedUser`.
- Selecionar `status` no `select(...)` e mapear (`status: p.status ?? (p.active ? "Ativo" : "Inativo")`).
- Manter `active` no tipo para não quebrar o restante da tela.

## UI — `_authenticated.administracao.tsx`

Mudança cirúrgica apenas no conteúdo da célula da coluna SITUAÇÃO. Sem alterar classes, ícones, cores, ordem, header, filtros, paginação ou outros elementos.

- Importar `useAuth`, `useServerFn`, `useQueryClient`, `toast` (sonner), `ConfirmDialog`, `setUserStatus`.
- Determinar `isAdmin = can("user.manage")` (já calculado para acesso à página).
- Estado local: `const [pendingToggle, setPendingToggle] = useState<ManagedUser | null>(null)` e `const [updatingId, setUpdatingId] = useState<string | null>(null)`.
- Substituir o conteúdo atual da `<td>` (que renderiza `Ativo`/`Inativo` com ícone) por:
  - Mesmo markup visual atual.
  - Quando `isAdmin`: envolver em `<button type="button" className="...">` com classes que **preservem o estilo atual** (`inline-flex items-center gap-1 text-xs ...`), sem alterar tamanho/cor — apenas adicionar `cursor-pointer` e `disabled:opacity-60`. `onClick` abre o `ConfirmDialog` com `pendingToggle = u`.
  - Quando não admin: manter exatamente o `<span>` atual (somente leitura).
- Adicionar `<ConfirmDialog>` (já existe em `src/components/confirm-dialog.tsx`) com:
  - Título: "Deseja alterar a situação deste usuário?"
  - Confirmar / Cancelar
  - `onConfirm`: chamar `setUserStatus({ data: { userId, status: novo } })`, em sucesso `toast.success("Situação do usuário atualizada com sucesso.")` + `queryClient.invalidateQueries({ queryKey: ["managed-users"] })`; em erro `toast.error("Não foi possível atualizar a situação do usuário.")`.

Nada mais é alterado.

## Critérios de aceite

- Layout, CSS, ordem de colunas, badge visual de Ativo/Inativo, filtros, paginação e fluxo de edição de papel permanecem idênticos.
- Admin: clique no texto "Ativo"/"Inativo" abre confirmação; ao confirmar, status alterna, lista atualiza sem reload, toast de sucesso.
- Não-admin: texto continua somente leitura, sem cursor pointer, sem ação.
- Tentativa direta via API por não-admin é rejeitada pelo `ensureAdmin`.
- Último admin ativo não pode ser inativado (mensagem clara).
- Coluna `status` existe em `profiles` com CHECK e default 'Ativo', sincronizada com `active` via trigger.

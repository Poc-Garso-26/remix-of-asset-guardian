## Objetivo
Exibir a "Situação" (Ativo/Inativo) do usuário no diálogo "Editar perfil de usuário" (`EditUserRoleDialog`), no mesmo bloco de informações onde já aparecem nome, e-mail e "Perfil atual".

## Origem dos dados
O objeto `ManagedUser` já recebido como prop pelo diálogo possui o campo `status: "Ativo" | "Inativo"` (preenchido por `listManagedUsers` em `src/lib/users-service.ts`). Reutiliza-se esse campo — sem nova consulta, hook, tabela ou tipo.

## Mudança
**`src/components/edit-user-role-dialog.tsx`**
- Importar `CheckCircle2` e `XCircle` de `lucide-react` (mesmo padrão visual já usado em `/administracao` e `/perfil`).
- No bloco `<div className="rounded-lg border ... p-3">` (cabeçalho do diálogo), logo abaixo da linha "Perfil atual: …", adicionar uma nova linha "Situação:" exibindo:
  - `Ativo` → ícone `CheckCircle2` + texto, em `text-success`
  - `Inativo` → ícone `XCircle` + texto, em `text-destructive`
- Mesmo tamanho/tipografia da linha "Perfil atual" (`text-xs text-muted-foreground` para o rótulo, badge inline para o valor) para manter consistência visual.

## Não alterado
- Sem mudanças em serviços, hooks, RLS, tabelas, server functions, fluxo de edição de perfil, layout do diálogo, listagem ou tela `/perfil`.
- Sem criação de arquivos ou componentes novos.

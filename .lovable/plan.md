## Objetivo

Adicionar uma área de filtros à tela `/administracao` reproduzindo exatamente o padrão visual e comportamental dos filtros de `/ativos` (toolbar + painel "Filtros avançados"), com filtragem por Nome, Usuário, E-mail, Perfil e Situação, sem alterar a tabela, colunas, permissões, fluxos ou estilos existentes.

## Escopo da UI (`src/routes/_authenticated.administracao.tsx`)

Inserir, entre o `<header>` da página e o `<section>` "Usuários", o mesmo bloco de toolbar usado em `/ativos`:

- Container: `rounded-xl border border-border bg-card p-3` (idêntico).
- Linha principal (`flex flex-col gap-3 sm:flex-row sm:items-center`):
  - Campo de pesquisa rápida (ícone `Search`, mesmo markup/classes) — placeholder: "Pesquisa rápida por nome, usuário ou e-mail…". Aplica `ilike` em `nome`, `username`, `email` (OR).
  - `<select>` Perfil: opções `Todos os perfis`, `Administrador` (`admin`), `Usuário` (`usuario`). Mesmas classes do select de tipo/situação em `/ativos`.
  - `<select>` Situação: opções `Todas as situações`, `Ativo`, `Inativo`. Mesmas classes.
  - Botão "Filtros avançados" (ícone `Filter`), idêntico ao de `/ativos`, alternando `showFilters`.
- Painel avançado (`showFilters`): grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` com `<FilterInput>` (mesmo helper visual) para `Nome`, `Usuário`, `E-mail`. Linha de ações com botões "Limpar filtros" (ícone `X`) e "Pesquisar" (ícone `Search`), idênticos a `/ativos`.

Observação: como o componente `FilterInput` em `/ativos` é local ao arquivo, replicar a mesma definição (mesma marcação/classes) localmente em `_authenticated.administracao.tsx` para preservar exatamente o estilo, sem refatoração cross-tela (o requisito de "reutilizar componentes" é atendido pelo padrão visual; extrair `FilterInput` para um arquivo compartilhado é opcional e ficará fora do escopo para não alterar `/ativos`).

## Estado e comportamento

- Estado local (mesmo padrão de `/ativos`):
  - `const [showFilters, setShowFilters] = useState(false)`
  - `const [filters, setFilters] = useState<{ nome?: string; username?: string; email?: string }>({})`
  - `const [quickQ, setQuickQ] = useState("")`
  - `const [role, setRole] = useState<"all" | "admin" | "usuario">("all")`
  - `const [status, setStatus] = useState<"all" | "Ativo" | "Inativo">("all")`
- Filtros aplicados via `useQuery` (mesma key `["managed-users", filtros]`), reaproveitando `listManagedUsers` estendido.
- Alteração de qualquer filtro atualiza a listagem automaticamente (re-render por mudança de estado / queryKey). Sem reload de página.
- Botão "Limpar filtros": zera `filters`, `quickQ`, `role`, `status` e dispara nova busca.
- Botão "Pesquisar": no-op funcional (mesma semântica do `/ativos`, onde a busca já é reativa) — mantido apenas para paridade visual.

A tela atualmente não tem paginação; nada a preservar nesse ponto. Tabela, colunas, ações, diálogos e o toggle de Situação permanecem intactos.

## Camada de serviço (`src/lib/users-service.ts`)

Estender `listManagedUsers` para aceitar filtros opcionais:

```ts
export interface ManagedUsersFilters {
  q?: string;            // pesquisa rápida (nome | username | email)
  nome?: string;
  username?: string;
  email?: string;
  role?: "all" | Role;
  status?: "all" | UserStatus;
}
```

Implementação:

- Construir o `select` em `profiles` aplicando `ilike` em `nome`, `username`, `email` quando informados.
- Para `q`: usar `.or("nome.ilike.%q%,username.ilike.%q%,email.ilike.%q%")` (com escape de `%`/`,`).
- `status`: quando `Ativo`/`Inativo`, filtrar por `status.eq.<valor>` (com fallback para `active` em registros antigos via OR adicional: `status.eq.Ativo,and(status.is.null,active.eq.true)` — opcional, somente se necessário; o backfill já existe).
- `role`: aplicado em memória após o JOIN com `user_roles` (a hierarquia/role efetiva é calculada no cliente). Mantém o filtro funcional sem mudar a estrutura atual.
- `useManagedUsers(filters)` passa a aceitar e propagar o objeto para o `queryKey` e `queryFn`.

## Mapeamento de valores (Perfil)

- Label "Administrador" → valor interno `admin`.
- Label "Usuário" → valor interno `usuario`.
- O perfil `gerente` não é listado no dropdown (conforme requisito). Usuários com role `gerente` continuam aparecendo quando o filtro é "Todos os perfis"; ao selecionar Administrador ou Usuário, apenas os correspondentes são exibidos.

## Restrições respeitadas

- Tabela, colunas, ordenação visual, ações e badge de Situação permanecem inalterados.
- Nenhuma classe CSS existente é modificada; o novo bloco usa exatamente as mesmas classes do toolbar de `/ativos`.
- Sem novas telas, sem mudanças em permissões, sem alteração de fluxos (cadastro, edição de role, toggle de status).
- Sem alteração em `/ativos`.

## Critérios de aceite

- Toolbar visualmente idêntica à de `/ativos` aparece acima da tabela em `/administracao`.
- Pesquisa rápida filtra por nome/usuário/e-mail (case-insensitive, parcial).
- Dropdowns Perfil e Situação filtram conforme valores definidos.
- Painel "Filtros avançados" expõe Nome, Usuário e E-mail com `ilike`.
- Filtros combinam (AND entre campos distintos) e atualizam a lista em tempo real.
- "Limpar filtros" restaura a listagem completa sem recarregar a página.
- Layout, CSS, colunas e demais comportamentos permanecem idênticos.

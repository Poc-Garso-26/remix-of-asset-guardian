
## Análise das entidades mockadas

A aplicação possui dois domínios principais mockados em `localStorage`:

1. **Ativos de TI** (`src/lib/assets-types.ts` + `assets-service.ts`) — tipos `computador`, `notebook`, `impressora`, com campos comuns (patrimônio, série, marca, modelo, setor, responsável, localização, status, datas) e específicos (processador/RAM/armazenamento/hostname/IP/MAC para máquinas; tipo de impressão/cor/rede para impressoras).
2. **Usuários gerenciados + RBAC** (`src/lib/users-mock.ts` + `auth.tsx`) — usuários com `role` (`admin | gerente | usuario`), credenciais e último login.

As tabelas atuais no Supabase (`ativos`, `categorias`, `itens`, `localizacoes`, `manutencoes`, `movimentacoes`) são genéricas e **não refletem** o modelo da UI (faltam tipo do ativo, campos de hardware, impressora, setor, responsável, etc.). O plano abaixo substitui/realinha o schema ao domínio real e adiciona o subsistema de perfis/papéis seguindo o padrão Lovable (tabela separada `user_roles` + função `has_role`).

## Modelo de dados proposto

### Enums
- `asset_type`: `computador | notebook | impressora`
- `asset_status`: `em_uso | estoque | manutencao | baixado`
- `print_type`: `laser | jato_tinta | termica | matricial`
- `app_role`: `admin | gerente | usuario`
- `maintenance_status`: `aberta | em_andamento | concluida | cancelada`
- `movement_type`: `entrada | saida | transferencia | manutencao | baixa`

### Tabelas (schema `public`)

**`sectors`** — setores da empresa (TI, RH, Financeiro…)
- `id uuid PK`, `nome text UNIQUE NOT NULL`, `created_at`, `updated_at`

**`locations`** — localizações físicas
- `id uuid PK`, `nome text NOT NULL`, `descricao text`, `endereco text`, `created_at`, `updated_at`
- Índice único `(nome)`

**`profiles`** — dados de perfil ligados a `auth.users` (1:1, sem FK direta para auth.users por padrão Lovable; `user_id uuid NOT NULL UNIQUE`)
- `id uuid PK`, `user_id uuid UNIQUE NOT NULL`, `nome text NOT NULL`, `email text NOT NULL UNIQUE`, `username text UNIQUE`, `active boolean DEFAULT true`, `last_login timestamptz`, `created_at`, `updated_at`
- Trigger `on_auth_user_created` (SECURITY DEFINER) para inserir perfil automaticamente

**`user_roles`** — papéis por usuário (separado por segurança)
- `id uuid PK`, `user_id uuid NOT NULL`, `role app_role NOT NULL`, `created_at`
- UNIQUE `(user_id, role)`
- Função `public.has_role(_user_id uuid, _role app_role)` SECURITY DEFINER

**`assets`** — ativos (substitui `ativos`)
- `id uuid PK`
- `type asset_type NOT NULL`
- `patrimony text NOT NULL UNIQUE` (código de patrimônio)
- `serial_number text NOT NULL UNIQUE`
- `brand text NOT NULL`, `model text NOT NULL`
- `sector_id uuid → sectors(id) ON DELETE RESTRICT`
- `responsible_profile_id uuid → profiles(id) ON DELETE SET NULL` (responsável)
- `responsible_name text` (fallback para nomes não cadastrados)
- `location_id uuid → locations(id) ON DELETE SET NULL`
- `status asset_status NOT NULL DEFAULT 'estoque'`
- `acquisition_date date`, `acquisition_value numeric(12,2)`
- `notes text`
- `created_at`, `updated_at`
- Índices: `(type)`, `(status)`, `(sector_id)`, `(location_id)`, `(responsible_profile_id)`, GIN/trigram em `patrimony`, `serial_number`, `model` para busca rápida.

**`asset_computer_specs`** — atributos específicos de computadores/notebooks (1:1 com `assets` quando `type ∈ {computador, notebook}`)
- `asset_id uuid PK → assets(id) ON DELETE CASCADE`
- `processor text`, `ram text`, `storage text`, `operating_system text`
- `hostname text UNIQUE`, `ip_address inet`, `mac_address macaddr`
- `created_at`, `updated_at`

**`asset_printer_specs`** — atributos específicos de impressoras (1:1)
- `asset_id uuid PK → assets(id) ON DELETE CASCADE`
- `print_type print_type`, `color boolean DEFAULT false`, `network boolean DEFAULT true`
- `created_at`, `updated_at`

**`maintenances`** — histórico de manutenções (substitui `manutencoes`)
- `id uuid PK`, `asset_id uuid NOT NULL → assets(id) ON DELETE CASCADE`
- `tipo text NOT NULL`, `descricao text NOT NULL`
- `status maintenance_status NOT NULL DEFAULT 'aberta'`
- `data_inicio timestamptz NOT NULL DEFAULT now()`, `data_fim timestamptz`
- `tecnico text`, `custo numeric(12,2)`, `observacoes text`
- `created_at`, `updated_at`
- Índices: `(asset_id)`, `(status)`, `(data_inicio DESC)`
- Constraint: `data_fim IS NULL OR data_fim >= data_inicio`

**`movements`** — movimentações de ativos (substitui `movimentacoes`)
- `id uuid PK`, `asset_id uuid NOT NULL → assets(id) ON DELETE CASCADE`
- `tipo movement_type NOT NULL`
- `from_location_id uuid → locations(id)`, `to_location_id uuid → locations(id)`
- `from_responsible_id uuid → profiles(id)`, `to_responsible_id uuid → profiles(id)`
- `motivo text`, `observacoes text`, `data timestamptz NOT NULL DEFAULT now()`
- `executed_by uuid → profiles(id)` (quem registrou)
- `created_at`
- Índices: `(asset_id, data DESC)`, `(tipo)`

### Relacionamentos (resumo)

```text
profiles (1) ─┬─< user_roles (N)
              ├─< assets.responsible_profile_id (N)
              └─< movements.executed_by / from / to (N)

sectors (1) ──< assets (N)
locations (1) ─< assets (N)  e  ─< movements.from/to (N)

assets (1) ─┬─1 asset_computer_specs
            ├─1 asset_printer_specs
            ├─< maintenances (N)
            └─< movements (N)
```

### Segurança (RLS)

Todas as tabelas com RLS habilitada. Política geral:
- **Leitura (`SELECT`)**: qualquer usuário `authenticated` (catálogo interno).
- **Escrita (`INSERT/UPDATE/DELETE`)**: somente quem tem `has_role(auth.uid(),'admin')` ou `'gerente'` em `assets`, `maintenances`, `movements`, `sectors`, `locations`.
- **`profiles`**: usuário lê/edita o próprio perfil; admin lê/edita todos.
- **`user_roles`**: somente `admin` gerencia; cada usuário lê os próprios papéis.
- `service_role` recebe `GRANT ALL` em todas; `authenticated` recebe os grants necessários conforme políticas; `anon` **não** recebe acesso (app é interno).

Trigger `update_updated_at_column()` aplicado em todas as tabelas com `updated_at`.

### Migrations a criar

1. **`0001_enums_and_core.sql`** — cria enums, `sectors`, `locations`, função `update_updated_at_column`, trigger genérico.
2. **`0002_profiles_and_roles.sql`** — `profiles`, `user_roles`, enum `app_role`, função `has_role`, trigger `handle_new_user` em `auth.users`.
3. **`0003_assets.sql`** — drop das tabelas antigas (`ativos`, `categorias`, `itens`, `manutencoes`, `movimentacoes` — `localizacoes` já foi mapeada para `locations` na #1; será dropada também), cria `assets`, `asset_computer_specs`, `asset_printer_specs` com índices e RLS.
4. **`0004_maintenances_movements.sql`** — `maintenances`, `movements` com índices, constraints e RLS.

> Observação: as tabelas existentes não contêm dados de produção (são seeds do template anterior). O plano **dropa** as tabelas antigas para não carregar schema redundante. Se você quiser preservá-las, me avise antes de aprovar.

## Detalhes técnicos

- Todas as PKs são `uuid DEFAULT gen_random_uuid()`.
- `created_at/updated_at` são `timestamptz NOT NULL DEFAULT now()`, com trigger `BEFORE UPDATE`.
- Validações de formato (email, MAC, IP) ficam a cargo dos tipos nativos (`inet`, `macaddr`) e da camada de aplicação.
- Os enums permitem evolução via `ALTER TYPE … ADD VALUE`.
- Migrations escritas em SQL puro, executadas em ordem via tool de migration (uma por chamada).

## Próximos passos pós-aprovação

1. Executar as 4 migrations.
2. Após aprovação automática dos types pelo Supabase, refatorar `assets-service.ts` e `users-mock.ts` para usar o cliente Supabase (fora deste plano — confirmo antes de partir).
3. Habilitar autenticação real (email/senha) para que o RLS funcione.

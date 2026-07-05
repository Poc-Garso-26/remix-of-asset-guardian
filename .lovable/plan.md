## Objetivo
Inserir 10 novos registros na tabela `public.assets` com tipo Computador e status Estoque, sem alterar schema, RLS ou código da aplicação.

## Schema verificado
- `type` — enum `public.asset_type` → valor a usar: `computador`
- `status` — enum `public.asset_status` → valor a usar: `estoque`
- Obrigatórios (NOT NULL sem default): `type`, `patrimony`, `serial_number`, `brand`, `model`
- Demais campos ficam nulos/default (`id`, `created_at`, `updated_at`, etc.)
- Último patrimônio existente segue o padrão `PAT-00100`

## Ação
Executar uma migration com um único `INSERT INTO public.assets (type, patrimony, serial_number, brand, model, status) VALUES ...` contendo 10 linhas:

- `patrimony`: `PAT-00101` a `PAT-00110` (únicos, sequência do padrão atual)
- `serial_number`: `SN-` + sufixo hex único de 10 chars (padrão dos registros existentes)
- `brand` / `model`: combinações coerentes de computador desktop (Dell OptiPlex 3090, HP EliteDesk 800 G6, Lenovo ThinkCentre M720, Positivo Master D570, Dell Vostro 3681, etc.)
- `type`: `'computador'`
- `status`: `'estoque'`

Nenhuma alteração de schema, policies, migrations estruturais, componentes, rotas ou lógica. Sem specs de computador/impressora e sem setor/localização (todos opcionais).

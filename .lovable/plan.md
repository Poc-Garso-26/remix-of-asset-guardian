## Objetivo
Adicionar campo **CEP** no formulário de cadastro/edição de ativos, com máscara `00000-000` e busca automática no ViaCEP que preenche **Logradouro, Bairro, Cidade e UF**. Persistir tudo no Supabase ao salvar.

## Mudanças

### 1. Banco de dados (migration)
Adicionar colunas em `public.assets`:
- `cep` (text, nullable)
- `logradouro` (text, nullable)
- `bairro` (text, nullable)
- `cidade` (text, nullable)
- `uf` (text, nullable, length 2)

Sem alterações em RLS/policies (já existentes cobrem a tabela).

### 2. Tipos e serviço
- `src/lib/assets-types.ts`: adicionar `cep`, `logradouro`, `bairro`, `cidade`, `uf` em `Asset`.
- `src/lib/assets-service.ts`: mapear os novos campos no create/update/list.

### 3. Componente novo: `src/components/cep-input.tsx`
- Input controlado com máscara `00000-000` (formata enquanto digita, aceita só dígitos).
- Quando atingir 8 dígitos válidos, faz `fetch("https://viacep.com.br/ws/{cep}/json/")`.
- Debounce simples (evita múltiplas chamadas).
- Estados: idle / loading (spinner ao lado do input) / error.
- Callback `onAddressResolved({ logradouro, bairro, localidade, uf })` para o form preencher os campos.
- Mensagens de erro inline:
  - "CEP não encontrado." (resposta `{ erro: true }`)
  - "Não foi possível consultar o CEP. Tente novamente." (falha de rede)
- Toda a chamada ocorre **só no frontend**; nada vai ao Supabase nesse momento.

### 4. `src/components/asset-form.tsx`
- Estender o schema Zod com `cep` (opcional, regex `^\d{5}-?\d{3}$` quando preenchido), `logradouro`, `bairro`, `cidade`, `uf` (todos opcionais).
- Nova seção/posição: **CEP imediatamente abaixo do campo Modelo** dentro da seção "Identificação" (`Modelo` está na grid 2-col; CEP entra como próximo `Field`, ocupando 1 coluna).
- Em "Alocação", após `Localização`, adicionar 4 campos editáveis: Logradouro, Bairro, Cidade, UF — preenchidos automaticamente pela resposta do ViaCEP via `form.setValue(..., { shouldDirty: true })`, mas livremente editáveis.
- Defaults vindos de `initial?.cep` etc. para a tela de edição.
- Nenhuma alteração no fluxo de submit/lógica de autenticação: o `onSubmit` existente (em `_authenticated.ativos.novo.tsx` e `_authenticated.ativos.$id.editar.tsx`) já delega a `assetsService.create/update`, que passará os novos campos.

### 5. Tela de detalhes
- `src/routes/_authenticated.ativos.$id.index.tsx`: exibir CEP + endereço quando presentes (somente leitura). _(Verificarei o arquivo antes de editar para manter o padrão visual.)_

## Fora de escopo
- Alterações em autenticação, RLS, ou na lógica de submit.
- Validação de UF contra lista fechada (mantém texto livre, ViaCEP já retorna válido).
- Backend proxy para ViaCEP (chamada permanece no client, conforme o pedido).

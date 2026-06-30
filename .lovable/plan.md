## Objetivo

Adicionar um filtro "QR Code" no painel de **Filtros avançados** da tela `/ativos`, permitindo restringir a lista de ativos pela presença/ausência do QR Code.

## Comportamento

Novo campo `select` em Filtros avançados, posicionado logo após "Sistema Operacional", com três opções:

- **Todos** (padrão, não filtra)
- **Com QR Code** (apenas ativos com `qrCodeUrl` preenchido)
- **Sem QR Code** (apenas ativos sem `qrCodeUrl`)

O filtro segue exatamente o mesmo padrão visual dos demais (mesmo label, mesma classe `rounded-md border border-input bg-background...`), respeita o botão "Limpar filtros" e participa do `useQuery` via `combined` (já reativo a `filters`).

## Implementação técnica

**`src/lib/assets-service.ts`**
1. Adicionar `qrCode?: "all" | "with" | "without"` em `AssetFilters`.
2. Em `matches()`, adicionar:
   ```ts
   if (f.qrCode === "with" && !a.qrCodeUrl) return false;
   if (f.qrCode === "without" && a.qrCodeUrl) return false;
   ```

**`src/components/assets-list-page.tsx`**
1. Criar um pequeno componente `FilterSelect` análogo a `FilterInput` (mesmo wrapper `<label>` e estilo), ou inline um `<select>` com as mesmas classes.
2. Adicionar o campo dentro do grid de filtros avançados (após "Sistema Operacional"):
   ```tsx
   <FilterSelect
     label="QR Code"
     value={filters.qrCode ?? "all"}
     onChange={(v) => setFilters((f) => ({ ...f, qrCode: v as "all" | "with" | "without" }))}
     options={[
       { value: "all", label: "Todos" },
       { value: "with", label: "Com QR Code" },
       { value: "without", label: "Sem QR Code" },
     ]}
   />
   ```
3. O "Limpar filtros" já chama `setFilters({})`, então o reset funciona automaticamente.

## Fora do escopo

- Não altera schema, RLS, edge functions, nem o tipo `Asset`.
- Não adiciona o filtro à URL (search params) — mantém o mesmo padrão dos outros campos de "Filtros avançados", que vivem apenas em `useState`.
- Não altera a coluna "QR Code" nem o hover-card já implementados.

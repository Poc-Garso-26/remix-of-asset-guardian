## Objetivo
Adicionar coluna **"QR Code"** na tabela de `/ativos`, imediatamente após **"Situação"**, exibindo miniatura do QR Code quando disponível (campo `qrCodeUrl` já existente no domínio `Asset`, carregado pela query atual via `assets_service`).

## Mudança única
**`src/components/assets-list-page.tsx`**

1. Inserir entrada `qrCode: "QR Code"` no objeto `COLUMNS` entre `status` e `createdAt` (define ordem do `<thead>` que é gerado por `Object.entries(COLUMNS)`).

2. Tornar a coluna `qrCode` **não-ordenável**: ajustar o `onClick` do `<th>` para ignorar a tecla quando `key === "qrCode"` e remover o cursor-pointer/seta apenas para essa coluna (sem alterar comportamento das demais).

3. Renderizar a célula `<td>` correspondente em cada linha, posicionada entre a célula de `StatusBadge` (linha 272) e a de `createdAt` (linha 273):
   - Se `a.qrCodeUrl` truthy → `<img src={a.qrCodeUrl} alt="" loading="lazy" className="h-10 w-10 rounded-sm border border-border object-contain bg-white" onError={(e) => { e.currentTarget.style.display = "none"; }} />`. O `onError` cobre URL inválida, arquivo removido do Storage ou falha de carregamento (célula fica vazia, sem erro visual).
   - Caso contrário → célula vazia (`<td className="px-4 py-3" />`).

4. Atualizar os `colSpan` dos estados "Carregando…" e "Nenhum ativo encontrado." de `9` para `10` (8 colunas atuais + QR Code + Ações).

5. Ajustar a chave `sortKey` para o tipo gerado por `keyof typeof COLUMNS` (já é) — a função `sorted` não precisa de caso especial: `qrCode` não é selecionável como sort. Garantir typesafety adicionando guarda `if (sortKey === "qrCode") return 0;` no comparator do `sorted`, ou simplesmente não tratando (já cai no `else` retornando 0 por falta de match).

## Origem do QR Code
- Campo `qr_code_url` em `public.assets`, mapeado para `Asset.qrCodeUrl` em `src/lib/assets-service.ts` (já no `SELECT *` da listagem). **Nenhuma query adicional por linha** — dado já vem no payload atual.

## Não alterado
- Sem mudanças em schema, RLS, edge function `generate-asset-qrcode`, filtros, ordenação das demais colunas, paginação, permissões, ou `Asset`/`assetsService`.
- Sem novos componentes ou arquivos.
- Nenhum texto/badge/ícone/placeholder quando ausente — célula totalmente vazia, conforme requisito.

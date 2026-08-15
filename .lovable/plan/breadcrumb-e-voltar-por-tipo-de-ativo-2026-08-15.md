# Breadcrumb e "Voltar" por tipo de ativo

Nas telas de detalhe e edição de ativo, o item do meio do breadcrumb e o link "Voltar" passam a apontar para a listagem dedicada do tipo do ativo carregado.

## Comportamento

| Tipo do ativo | Breadcrumb | Destino do item / do "Voltar" |
| --- | --- | --- |
| computador | Inventário › Computadores › PAT-00102 | /ativos/computadores |
| notebook | Inventário › Notebooks › PAT-00102 | /ativos/notebooks |
| impressora | Inventário › Impressoras › IMP-010101 | /ativos/impressoras |

- Na edição, a trilha continua com um nível extra: Inventário › Impressoras › IMP-010101 › Editar (o patrimônio segue como link para o detalhe).
- O texto dos botões passa a nomear o destino: "Voltar para impressoras" / "Voltar para computadores" / "Voltar para notebooks" no detalhe; na edição o botão "Voltar ao ativo" permanece apontando para o detalhe (não muda).
- Primeiro item ("Inventário" → /ativos) inalterado. Nenhuma outra tela muda.

## Detalhes técnicos

- Em `src/lib/assets-types.ts`, adicionar dois mapas ao lado de `ASSET_TYPE_LABEL`, como fonte única:
  - `ASSET_TYPE_PLURAL_LABEL: Record<AssetType, string>` → "Computadores" | "Notebooks" | "Impressoras" (mesmos rótulos do menu lateral).
  - `ASSET_TYPE_LIST_ROUTE: Record<AssetType, string>` → "/ativos/computadores" | "/ativos/notebooks" | "/ativos/impressoras".
- `src/routes/_authenticated.ativos.$id.index.tsx`: item do meio do breadcrumb usa `ASSET_TYPE_PLURAL_LABEL[asset.type]` + `to: ASSET_TYPE_LIST_ROUTE[asset.type]`; o botão "Voltar" navega para a mesma rota. Estrutura do `Breadcrumbs` (aria-current no último item, `nav aria-label="Breadcrumb"`, `<ol>`) intacta.
- `src/routes/_authenticated.ativos.$id.editar.tsx`: mesma troca no item do meio; demais itens e botão inalterados.
- Sem mudança em `src/components/breadcrumbs.tsx`; `to` continua string literal aceita pelo `Link`.

## Validação

- Typecheck (`tsgo`).
- As rotas exigem sessão autenticada (Supabase externo), então o teste automatizado no sandbox é limitado; se possível verifico via Playwright com sessão, caso contrário sinalizo.
- Roteiro manual: abrir um ativo de cada tipo, conferir o rótulo/destino do item do meio e do "Voltar", e repetir na tela de edição.

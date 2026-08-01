# Bloco G-8 — Propósito do link "Ver todos" e informação do arquivo PDF

## Item 1 — Link "Ver todos" (WCAG 2.4.4)

`src/routes/_authenticated.dashboard.tsx`: adicionar `aria-label="Ver todos os ativos"` ao `<Link to="/ativos">` do cartão "Últimos ativos cadastrados". O texto visível continua "Ver todos".

## Item 2 — Botão "Exportar PDF": nome e tamanho do arquivo

### Situação atual (verificada)
A geração é **100% client-side** com jsPDF em `src/lib/pdf-export.ts`. A função `exportAssetsPdf` já define um nome descritivo (`<slug-do-titulo>-AAAA-MM-DD.pdf`, ex.: `todos-os-ativos-2026-08-01.pdf`) e chama `doc.save(...)`, mas hoje não retorna nada e o toast de sucesso só informa a quantidade de registros.

Como o PDF é montado no navegador, o tamanho real **é conhecido no momento da geração** (`doc.output("blob").size`), mas não antes do clique. Abordagem escolhida: manter o nome descritivo e **anunciar nome + tamanho após a geração** via toast (o Sonner já é uma região `aria-live="polite"`), sem prometer estimativa prévia impossível.

### Alterações
- `src/lib/pdf-export.ts`: `exportAssetsPdf` passa a retornar `{ fileName, sizeBytes }`, calculando o tamanho a partir do blob antes de salvar; incluir helper `formatFileSize` (KB/MB, pt-BR).
- `src/components/assets-list-page.tsx` (página "Todos os ativos" e derivadas):
  - `aria-label` do botão: "Exportar PDF com os ativos listados (download de arquivo PDF)".
  - toast de sucesso passa a informar: `Arquivo todos-os-ativos-2026-08-01.pdf gerado (≈ 128 KB)`.
- `src/routes/_authenticated.relatorios.tsx`: mesmo tratamento (aria-label no botão + toast com nome e tamanho), para consistência.

## Validação
- Playwright: renderizar a listagem não é possível sem sessão no sandbox; validar o cálculo de nome/tamanho executando `exportAssetsPdf` em navegador headless com dados de exemplo (stub do `doc.save`) e conferir o retorno `{fileName, sizeBytes}`.
- Conferir por código/DOM o `aria-label` do link "Ver todos" e dos botões de exportação, e que nada muda visualmente.

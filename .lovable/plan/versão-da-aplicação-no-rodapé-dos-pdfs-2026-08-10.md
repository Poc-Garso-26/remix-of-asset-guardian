# Versão da aplicação no rodapé dos PDFs

## Situação atual (verificada)

Os dois PDFs do sistema — "Exportar PDF" da listagem (`src/components/assets-list-page.tsx`) e "Geração de Relatórios" (`src/routes/_authenticated.relatorios.tsx`) — chamam a mesma função `exportAssetsPdf` de `src/lib/pdf-export.ts`. Logo, uma única alteração cobre os dois casos.

Hoje o rodapé de cada página (callback `didDrawPage`) mostra `GestãoTI - Confidencial` à esquerda e `Página X de Y` à direita.

## Alteração

Apenas `src/lib/pdf-export.ts`:

- Importar `APP_VERSION_SHORT` de `@/lib/app-version` (que já deriva de `VITE_APP_VERSION` → campo `version` do `package.json`). Nenhum número de versão escrito à mão.
- No rodapé, o texto da esquerda passa a ser `GestãoTI v1.0.1 - Confidencial`, montado com `pdfSafeText` e mantendo a mesma posição, fonte (8pt) e cor (slate-400) atuais.
- Nada mais muda: cabeçalho, título, filtros, tabela, nome do arquivo e o toast de tamanho seguem iguais.

Como a versão é lida da constante compartilhada, um futuro bump no `package.json` (ex.: 1.0.1 → 1.1.0) aparece automaticamente nos relatórios.

## Validação

Gerar os dois PDFs em navegador headless (listagem com filtros e relatório com período), extrair o texto e confirmar que cada página traz `GestãoTI v<versão atual> - Confidencial`, além de conferir visualmente a renderização do rodapé.

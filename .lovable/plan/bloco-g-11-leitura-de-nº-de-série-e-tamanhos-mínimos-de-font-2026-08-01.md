# Bloco G-11 — Leitura de "Nº de série" e tamanhos mínimos de fonte

Dois itens independentes, aplicados na ordem abaixo.

## Item 1 — "Nº de série" lido incorretamente

Ocorrências encontradas do rótulo (não há coluna "Nº de série" na tabela; o rótulo aparece nos filtros, no detalhe e no formulário):

- `src/components/assets-list-page.tsx` — rótulo do filtro "Nº de série"
- `src/routes/_authenticated.ativos.$id.index.tsx` — linha de detalhe "Nº de série"
- `src/components/asset-form.tsx` — rótulo do campo "Nº de série" e mensagem de validação "Informe o nº de série"
- `src/lib/pdf-export.ts` — linha de filtro impressa no PDF

Abordagem: manter o texto visível curto onde o espaço é apertado, mas garantir a leitura correta.

- Filtro e formulário: rótulo visual continua "Nº de série", com o símbolo marcado `aria-hidden` e o texto completo em `sr-only` ("Número de série"), de modo que o leitor de tela anuncie "Número de série". O `aria-label`/`for` do input passa a apontar para o nome completo, sem duplicar a leitura.
- Página de detalhe do ativo: mesma técnica no rótulo da linha.
- Mensagem de validação: "Informe o número de série" (texto por extenso).
- PDF: "Número de série: ..." (texto por extenso; não há restrição de espaço relevante).

## Item 2 — Fontes muito pequenas

Alvo principal: `src/components/app-shell.tsx`.

- Subtítulo do logo "Ativos de TI" e rótulos de seção "NAVEGAÇÃO"/"CONTA": de `text-[10px]` (10px) para `text-xs` (12px), mínimo absoluto recomendado.
- Itens de navegação e botão "Sair": de `text-sm` (14px) para `text-base` (16px).
- Nome do usuário no cabeçalho: `text-sm` → `text-base`; o papel do usuário (`roleLabel`) fica em `text-xs` (12px) como rótulo secundário.
- Ajustes proporcionais para não quebrar o layout: leve aumento de `py` nos itens do menu, verificação de truncamento dos rótulos mais longos ("Todos os ativos", "Administração") na largura de 256px e no estado recolhido (só ícones), além do avatar/cabeçalho de 16px de altura fixa.

Rodapé/badges: os textos citados já estão em `text-xs` (12px), no mínimo recomendado — serão conferidos, mas sem mudança se já atenderem.

## Validação

- Playwright na tela de login e, quando a sessão permitir, no dashboard: medir `font-size` computado dos elementos alterados (esperado ≥ 12px nos rótulos secundários e 16px nos itens de menu) e capturar screenshots do menu expandido e recolhido em 939px e 320px para checar quebra de layout.
- Inspeção do DOM confirmando que o nome acessível dos campos de série é "Número de série".
- `tsgo` para integridade de tipos.

## Detalhes técnicos

Nenhuma mudança de lógica de negócio, serviços ou banco. Só rótulos, ARIA e classes utilitárias de tipografia/espaçamento.

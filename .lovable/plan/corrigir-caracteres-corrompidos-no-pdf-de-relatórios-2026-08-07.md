# Corrigir caracteres corrompidos no PDF de relatórios

## Diagnóstico (verificado no código)

Em `src/lib/pdf-export.ts` o PDF usa a fonte padrão do jsPDF (Helvetica, codificação de 1 byte). Três caracteres Unicode fora dessa codificação aparecem no documento:

- `→` (seta) entre as datas dos intervalos: linhas de `Cadastro:` e `Aquisição:` — é o "!'" que você viu.
- `•` (bullet) usado para separar os itens da linha "Filtros aplicados".
- `—` (travessão) em duas situações: valor de data vazia (`fmtDate` retorna `—`) e o rodapé `GestãoTI — Confidencial`.

Acentos comuns (ã, ç, í) funcionam porque estão na codificação de 1 byte; setas e bullets não.

## Mudanças em `src/lib/pdf-export.ts`

- Intervalos de data: `Cadastro: 01/08/2026 ate 07/08/2026` — usar a palavra "até" por extenso em vez de `→`. Quando só um lado do intervalo é informado, escrever "a partir de <data>" ou "até <data>", evitando o placeholder vazio.
- Separador entre filtros: trocar `  •  ` por `  |  ` (ASCII, seguro e legível).
- `fmtDate` sem valor: retornar `-` (hífen simples) em vez de `—`.
- Rodapé: `GestãoTI - Confidencial` com hífen simples.
- Rede de segurança: sanitizar todo texto enviado ao PDF (título, filtros, células da tabela) com um helper que mapeia caracteres tipográficos comuns para ASCII (`– — → • “ ” ‘ ’ …`), preservando acentos. Assim dados vindos do banco (marca, modelo, setor) com aspas curvas ou travessão também saem corretos.

## Validação

Gerar um PDF de exemplo em navegador headless, com filtro de período preenchido, extrair o texto do arquivo e conferir que a linha "Filtros aplicados" traz `01/08/2026 até 07/08/2026`, sem caracteres corrompidos, e inspecionar visualmente a página renderizada (cabeçalho, tabela e rodapé).

Nada muda na tela de Geração de Relatórios nem nos filtros — apenas o conteúdo do PDF.

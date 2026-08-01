# Bloco G-10 — Mês corrente no gráfico de aquisições e formato de data brasileiro

## Item 1 — Gráfico não conta o mês corrente

### Causa raiz (confirmada por leitura do código)

Em `src/lib/assets-service.ts`, `acquisitionsTimeline()` agrupa as aquisições assim:

```
const d = new Date(source);          // source = "2026-08-01"
const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
```

`acquisition_date` é uma data pura (`YYYY-MM-DD`). `new Date("2026-08-01")` é
interpretado pelo JS como **meia-noite UTC**; já `getFullYear()/getMonth()` leem
o **fuso local** (Brasil = UTC-3). Resultado: 01/08/2026 vira 31/07/2026 na
agregação, e o ativo é contado em julho, não em agosto. O gráfico mostra 0 para
agosto — exatamente o sintoma relatado.

As outras hipóteses foram descartadas:

- **Intervalo de 12 meses**: os buckets vão de `now.getMonth() - 11` até
  `now.getMonth()`, ou seja o mês corrente **está** incluído.
- **Cache**: a query do gráfico usa a chave `["assets", "acquisitions-timeline"]`,
  que é invalidada pelo prefixo `["assets"]` após criar/editar/excluir ativo.

### Correção

Fazer o parsing da data pura no fuso local, sem passar por UTC: quando o valor
casar com `YYYY-MM-DD`, extrair ano/mês/dia da própria string (ou construir
`new Date(ano, mês-1, dia)`); apenas timestamps completos (`created_at`, que é
ISO com fuso) continuam usando `new Date(...)`. A mesma normalização será
aplicada ao fallback `created_at` para que o mês exibido seja o mês local.

### Melhoria adjacente (baixo risco, mesmo bloco)

A chave `["assets-status-distribution"]` do gráfico de rosca não é invalidada
em nenhum fluxo de criação/edição/exclusão, então aquele gráfico pode ficar
desatualizado pelo mesmo tipo de motivo. Incluir essa invalidação junto com as
existentes (`novo`, `editar`, exclusão na listagem e no detalhe).

## Item 2 — Campo "Data de aquisição" em mm/dd/aaaa

### Opções avaliadas

1. **Forçar formato no `<input type="date">`**: não é possível. O formato de
   exibição é definido pelo locale do navegador/SO; não existe atributo ou
   propriedade CSS/HTML que o altere. Descartada.
2. **Date picker do design system (shadcn Calendar + Popover)**: os componentes
   `calendar.tsx` e `popover.tsx` já existem no projeto. Exibe sempre
   `dd/mm/aaaa` com `date-fns`/locale pt-BR, independente do navegador.
   Trade-off: perde o teclado numérico nativo em mobile e exige cuidado extra de
   acessibilidade — que já é o padrão de trabalho neste projeto.
3. **Manter o input nativo + texto de apoio**: mínimo esforço, mas não resolve o
   problema relatado.

### Abordagem escolhida

Opção 2 com rede de segurança: substituir o `<input type="date">` por um campo
de data em português com máscara `dd/mm/aaaa` (digitação livre) acoplado ao
`Calendar` do shadcn em um `Popover`, mantendo o valor interno em ISO
(`YYYY-MM-DD`) para não mudar nada no serviço/banco. Abaixo do campo fica a
dica visível "Formato dd/mm/aaaa", que também serve de fallback textual.

O campo continua registrado no `react-hook-form` sob `acquisitionDate`,
preservando validação Zod, resumo de erros, foco no primeiro erro (`FIELD_ORDER`)
e as relações ARIA do componente `Field`.

## Detalhes técnicos

- `src/lib/assets-service.ts`: helper local de parsing de data pura em fuso
  local, usado em `acquisitionsTimeline()`.
- Novo `src/components/date-field.tsx`: input com máscara dd/mm/aaaa + botão de
  calendário (`Popover` + `Calendar`, `locale` pt-BR, `className` com
  `pointer-events-auto`), props `value`/`onChange` em ISO, `aria-describedby`
  encaminhado, `aria-label` no botão do calendário.
- `src/components/asset-form.tsx`: usa `DateField` no campo "Data de aquisição",
  com texto de apoio "Formato dd/mm/aaaa".
- Invalidação de `["assets-status-distribution"]` em
  `_authenticated.ativos.novo.tsx`, `_authenticated.ativos.$id.editar.tsx`,
  `_authenticated.ativos.$id.index.tsx` e `assets-list-page.tsx`.
- Dependência `date-fns` já está no projeto (usada pelo padrão shadcn); se não
  estiver instalada, a formatação será feita com `Intl.DateTimeFormat("pt-BR")`,
  sem adicionar pacote.

## Validação

- Playwright no preview: abrir `/ativos/novo`, conferir que o campo mostra
  `dd/mm/aaaa`, digitar `01/08/2026`, abrir o calendário pelo teclado, escolher
  uma data e confirmar Esc/foco.
- Conferir em `/dashboard` que agosto/2026 passa a contar o ativo com aquisição
  em 01/08/2026 (inclui o registro de teste IMP-010101, que permanece no banco).
- Consulta ao banco para comparar a contagem por mês esperada com o gráfico.

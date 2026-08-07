# Datas dos Filtros avançados em dd/mm/aaaa

Os quatro campos de data dos Filtros avançados da listagem de ativos ("Cadastro de", "Cadastro até", "Aquisição de", "Aquisição até") hoje usam `FilterInput` com `type="date"`, ou seja o input nativo do navegador — que exibe mm/dd/aaaa quando o locale do SO/navegador não é pt-BR. É o mesmo problema já resolvido no formulário de ativo.

## Mudança

Reaproveitar o componente existente `src/components/date-field.tsx` (máscara dd/mm/aaaa + calendário pt-BR, valor interno em ISO `YYYY-MM-DD`):

- Em `FilterInput`, quando `type="date"`, renderizar `<DateField>` em vez do `<input type="date">`, mantendo o mesmo rótulo, `id`/`htmlFor` e estilo do campo.
- Os quatro campos de data continuam chamando o mesmo `onChange` de antes, recebendo a data em ISO — nada muda em `filters`, no serviço ou no banco.
- Abaixo de cada campo de data, a dica "Formato dd/mm/aaaa" (texto pequeno), coerente com o formulário de ativo.

## Comportamento do filtro (Bloco G-2)

Preservado: `DateField` só atualiza o estado local `filters`; a busca continua acontecendo apenas ao clicar em "Pesquisar" (`setAppliedFilters(filters)`). "Limpar filtros" zera `filters`, e o `DateField` já sincroniza quando o valor externo muda.

## Detalhes técnicos

- Arquivo alterado: `src/components/assets-list-page.tsx` (apenas `FilterInput`).
- `DateField` recebe `id` e o `className` atual do input para manter a aparência.

## Validação

Playwright no preview com `locale="en-US"` (e também pt-BR): abrir Filtros avançados em `/ativos`, conferir placeholder/valor em dd/mm/aaaa nos quatro campos, digitar uma data, confirmar que a tabela só muda após clicar em "Pesquisar", e testar "Limpar filtros". Screenshots como evidência.

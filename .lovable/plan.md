## Plano: correção pontual de visibilidade dos textos descritivos dos gráficos

### Contexto
No item 26 (Bloco D) foram adicionadas descrições textuais alternativas e tabelas de dados brutos aos gráficos `AssetsStatusChart` e `AssetsTimelineChart`. O usuário relatou que esses textos ficaram visíveis na tela, duplicando o título/subtítulo de cada card.

### Escopo
Aplicar apenas a correção pontual de visibilidade. Nenhuma outra alteração nos gráficos.

### Arquivos
- `src/components/assets-status-chart.tsx`
- `src/components/assets-timeline-chart.tsx`

### Passos

1. **Revisar `AssetsStatusChart`**
   - Localizar a tabela de dados brutos e o texto descritivo abaixo do gráfico.
   - Se estiverem visíveis, aplicar `sr-only` (mantendo-os no DOM para leitores de tela).
   - Preservar `role="img"` e `aria-label` do gráfico.

2. **Revisar `AssetsTimelineChart`**
   - Localizar a tabela de dados brutos e o texto descritivo abaixo do gráfico.
   - Se estiverem visíveis, aplicar `sr-only`.
   - Preservar `role="img"` e `aria-label` do gráfico.

3. **Validar**
   - Executar `bun run build` para garantir que não houve regressão.
   - Informar ao usuário o que foi alterado em cada arquivo.

### Resultado esperado
- O texto/tabela descritiva deixa de ser visível na tela.
- Leitores de tela continuam anunciando a descrição via `aria-label` e/ou tabela `sr-only`.
- O dashboard continua funcionando normalmente.

# Bloco G-5 — Contraste do gráfico de rosca e scroll da tabela do Dashboard

Dois itens independentes, aplicados um a um.

## Item 1 — Contraste entre segmentos do gráfico de rosca

Hoje o gráfico usa os mesmos tokens de status da interface (`--success`, `--info`, `--warning`, `--muted-foreground`). Essas cores foram escolhidas para contraste com o fundo, não entre si — por isso verde/azul ficam com luminosidade quase idêntica.

Correção: criar um conjunto de cores dedicado ao gráfico (tokens próprios de "situação em gráfico"), mantendo as matizes semânticas já estabelecidas (verde = em uso, azul = estoque, laranja = manutenção, cinza = baixado) e distribuindo a luminosidade em uma escala escalonada, de modo que cada par vizinho no anel fique acima de 3:1.

- Escala planejada (matiz preservada, luminosidade escalonada): verde claro, azul escuro, laranja claro, cinza médio-escuro — alternando claro/escuro para que vizinhos contrastem.
- Definir os tokens nos temas claro e escuro (e no tema de alto contraste, se presente), ajustando a luminosidade em cada tema.
- O gráfico passa a ler esses tokens; badges, textos e demais componentes de status permanecem inalterados.
- Contorno das fatias continua existindo como reforço visual.

Validação: cálculo real de contraste WCAG entre os pares adjacentes (Em uso↔Estoque, Estoque↔Manutenção, Manutenção↔Baixado, Baixado↔Em uso), nos dois temas, com os valores antes/depois reportados. Ajuste iterativo até todos os pares ≥ 3:1.

## Item 2 — Scroll horizontal na tabela "Últimos ativos cadastrados"

A tabela do Dashboard está dentro de um contêiner com `overflow-hidden`, então em 320px o conteúdo é cortado sem alternativa de navegação. As demais tabelas do sistema (listagem de ativos, administração) usam um wrapper com `overflow-x-auto`.

Correção: aplicar o mesmo padrão — wrapper com rolagem horizontal e largura mínima na tabela, para que em telas estreitas exista scroll em vez de corte. Sem mudança de layout em telas largas.

Validação: renderizar o Dashboard a 320px de largura e confirmar que a tabela apresenta rolagem horizontal e que todas as colunas ficam alcançáveis, comparando com a listagem de ativos.

## Detalhes técnicos

- `src/styles.css`: novos tokens de cor para segmentos do gráfico de situação, por tema.
- `src/components/assets-status-chart.tsx`: mapa `KNOWN_COLORS` passa a apontar para os novos tokens.
- `src/routes/_authenticated.dashboard.tsx`: wrapper da tabela recente com `overflow-x-auto` + `min-w` na tabela.
- Verificação de contraste feita por script (conversão OKLCH→sRGB e razão de luminância relativa) e checagem responsiva via navegador headless.

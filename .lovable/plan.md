# Diagnóstico de escopo — meta AAA (7:1) de contraste de texto

Levantamento apenas: nenhum código alterado. Contrastes calculados a partir dos tokens de `src/styles.css` (conversão OKLCH → sRGB + razão de luminância relativa WCAG), mesmo método dos Blocos G-5/G-9/G-13/G-14. Temas claro e escuro. O tema `.high-contrast` não foi incluído porque já é projetado para AAA.

## Tema claro

| Par (texto / fundo) | Contraste | AA 4,5:1 | AAA 7:1 | Gap | Dificuldade |
| --- | --- | --- | --- | --- | --- |
| Texto padrão / fundo de página | 16,57 | Sim | Sim | — | — |
| Texto padrão / fundo de card | 17,29 | Sim | Sim | — | — |
| Link (primário) / card | 7,51 | Sim | Sim | — | — |
| Link em ênfase / card | 12,71 | Sim | Sim | — | — |
| Botão primário: texto / fundo | 7,30 | Sim | Sim | — | — |
| Botão secundário: texto / fundo | 7,95 | Sim | Sim | — | — |
| Item ativo do menu: texto / fundo | 10,97 | Sim | Sim | — | — |
| Badge Manutenção: texto / fundo | 8,53 | Sim | Sim | — | — |
| Badge Baixado: texto / fundo | 14,06 | Sim | Sim | — | — |
| Texto sobre success subtle | 6,89 | Sim | Não | 0,11 | Fácil |
| Texto sobre info subtle | 6,77 | Sim | Não | 0,23 | Fácil |
| Texto muted / card | 5,99 | Sim | Não | 1,01 | Fácil |
| Texto muted / fundo de página | 5,74 | Sim | Não | 1,26 | Fácil |
| Texto sobre warning subtle | 5,50 | Sim | Não | 1,50 | Fácil |
| Texto muted / fundo muted | 5,33 | Sim | Não | 1,67 | Médio |
| Botão destrutivo: texto / fundo | 5,29 | Sim | Não | 1,71 | Médio (identidade) |
| Accent institucional: texto / fundo | 4,52 | Sim (no limite) | Não | 2,48 | Difícil (identidade) |
| **Badge Em uso: texto / fundo** | **3,91** | **Não** | Não | 3,09 | Médio |
| **Badge Estoque: texto / fundo** | **3,41** | **Não** | Não | 3,59 | Médio |

## Tema escuro

| Par (texto / fundo) | Contraste | AA 4,5:1 | AAA 7:1 | Gap | Dificuldade |
| --- | --- | --- | --- | --- | --- |
| Texto padrão / fundo de página | 17,24 | Sim | Sim | — | — |
| Texto padrão / fundo de card | 15,48 | Sim | Sim | — | — |
| Badge Baixado | 11,89 | Sim | Sim | — | — |
| Badge Manutenção | 10,61 | Sim | Sim | — | — |
| Link em ênfase / card | 10,53 | Sim | Sim | — | — |
| Texto sobre success / info / warning subtle | 8,74 / 8,67 / 8,37 | Sim | Sim | — | — |
| Item ativo do menu | 8,51 | Sim | Sim | — | — |
| Badge Estoque | 8,66 | Sim | Sim | — | — |
| Badge Em uso | 8,01 | Sim | Sim | — | — |
| Texto muted / fundo de página | 7,59 | Sim | Sim | — | — |
| Botão primário | 7,56 | Sim | Sim | — | — |
| Botão secundário | 7,44 | Sim | Sim | — | — |
| Accent institucional: texto / fundo | 7,11 | Sim | Sim | — | — |
| Texto muted / card | 6,81 | Sim | Não | 0,19 | Fácil |
| Link (primário) / card | 6,79 | Sim | Não | 0,21 | Fácil |
| Texto muted / fundo muted | 6,08 | Sim | Não | 0,92 | Fácil |
| Botão destrutivo | 6,29 | Sim | Não | 0,71 | Fácil |

## Achado que precede a discussão de AAA

Dois pares **não atendem nem o mínimo AA no tema claro**: as etiquetas "Em uso" (3,91:1) e "Estoque" (3,41:1). Elas usam texto branco (`--pi-success-contrast` / `--pi-info-contrast`) sobre os tons médios `--pi-success` e `--pi-info`. Isso é uma falha de conformidade AA independente da meta AAA e, se confirmado como prioridade, deve ser tratado antes.

## Baixo impacto visual (matiz preservada, só ajuste de luminosidade)

- Texto muted (página, card, fundo muted) — escurecer `--pi-muted-color` cerca de um tom no tema claro e no escuro clarear levemente.
- Textos sobre fundos "subtle" (success, info, warning) — faltam de 0,11 a 1,50; ajuste no token `*-text-emphasis`.
- Link primário no tema escuro — falta 0,21.
- Botão destrutivo no tema escuro — falta 0,71.

## Risco à identidade visual

- **Accent institucional PBH** (vermelho/laranja `--pi-accent`, 4,52:1 no claro): chegar a 7:1 com texto branco exige escurecer bastante o vermelho institucional, descaracterizando a cor da marca. Alternativa sem mexer na cor: usar o accent apenas como fundo de área grande com texto escuro, ou restringir texto sobre accent a tamanho "large text" (AAA aceita 4,5:1 para texto grande).
- **Botão destrutivo no tema claro** (5,29:1): mesma família de vermelho; 7:1 exigiria um vermelho bem mais escuro, próximo de vinho.
- **Etiquetas de situação (verde/azul)**: além do problema de AA, há a restrição já resolvida no Bloco G-5 de manter ≥ 3:1 *entre* as fatias do gráfico. Qualquer nova escala precisa satisfazer as duas condições ao mesmo tempo — por isso classifiquei como "médio", não "fácil".
- **Azul institucional primário** já atende 7:1 nos dois temas; não é ponto de atrito.

## Resumo quantitativo

- Pares avaliados: 37 (19 no claro + 18 no escuro, contando os agrupados).
- Já atendem 7:1 hoje: 22.
- Precisam de ajuste leve (gap ≤ 1,7, só luminosidade, matiz preservada): 11.
- Exigiriam decisão sobre paleta/identidade: 4 (accent institucional claro, destrutivo claro, badges Em uso e Estoque no claro).
- Falhas de AA que existem hoje: 2 (badges Em uso e Estoque, tema claro).

Conclusão de escopo: AAA é alcançável em cerca de 90% dos pares com ajustes de luminosidade de baixo risco. O bloqueio real está concentrado na família de vermelho/laranja institucional e nas etiquetas de situação, que precisariam de uma decisão explícita de design (ou uso de texto grande) antes de qualquer implementação.

## Próximo passo sugerido

Se você quiser seguir, o caminho natural é um bloco corretivo em duas etapas: primeiro fechar as duas falhas de AA das etiquetas, depois um segundo bloco com os 11 ajustes leves de luminosidade — deixando os casos de identidade para decisão à parte.

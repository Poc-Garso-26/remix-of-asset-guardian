# Frente 2 — Ajustes "fáceis" para AAA (7:1)

Somente luminosidade dos tokens; matizes preservadas. Fora do escopo: accent institucional (vermelho/laranja) e botão destrutivo do **tema claro**. O destrutivo do **tema escuro** entra, conforme o diagnóstico.

## Confirmação da lista

Os 10 pares informados foram remedidos e batem exatamente com o diagnóstico anterior (6,89 / 6,77 / 5,99 / 5,74 / 5,50 / 5,33 no claro; 6,81 / 6,79 / 6,08 / 6,29 no escuro). O 11º item do levantamento (link primário sobre o fundo de página, tema escuro) já está em 7,56:1 e não precisa de ajuste — será apenas reverificado após as mudanças.

## Ajustes de token (src/styles.css)

Tema claro (`:root`):

| Token | L atual → nova | Par medido | Antes → Depois |
|---|---|---|---|
| `--pi-success-text-emphasis` | 0.42 → 0.41 | texto sobre success subtle | 6,89 → 7,18 |
| `--pi-info-text-emphasis` | 0.42 → 0.41 | texto sobre info subtle | 6,77 → 7,06 |
| `--pi-warning-text-emphasis` | 0.50 → 0.44 | texto sobre warning subtle | 5,50 → 7,11 |
| `--pi-muted-color` | 0.50 → 0.435 | muted / fundo muted | 5,33 → 7,06 |

O ajuste único de `--pi-muted-color` resolve os três pares de texto secundário do tema claro, pois o fundo muted é o caso mais severo: card → 7,92 e fundo de página → ~7,7.

Tema escuro (`.dark`):

| Token | L atual → nova | Par medido | Antes → Depois |
|---|---|---|---|
| `--pi-muted-color` | 0.72 → 0.765 | muted / fundo muted | 6,08 → 7,15 (card → 8,01) |
| `--pi-primary` | 0.72 → 0.735 | link primário / card | 6,79 → 7,17 (fundo de página → 7,99) |
| `--pi-danger` | 0.70 → 0.76 | botão destrutivo | 6,29 → 7,10 |

## Efeitos colaterais a verificar

- `--pi-muted-color` alimenta `--muted-foreground`: textos secundários, placeholders, descrições de card, legendas de gráfico e rodapés. Verificar que não fica excessivamente escuro (claro) ou claro (escuro).
- `--pi-primary` (escuro) alimenta `primary`, `sidebar-primary`, `ring` e `--chart-1`: checar botão primário com texto escuro, item ativo do menu, anel de foco e o gráfico de aquisições.
- `--pi-danger` (escuro) alimenta `destructive`: checar botão de exclusão e estados de erro.
- `*-text-emphasis` alimenta `secondary-foreground`/`accent-foreground` e textos de aviso: checar badges e alertas.
- Reconfirmar que os segmentos do gráfico de rosca (Bloco G-5, tokens `--chart-status-*`) continuam ≥ 3:1 entre vizinhos — não são tocados aqui, mas serão remedidos.
- Reconfirmar as etiquetas "Em uso"/"Estoque" (Frente 1) ainda ≥ 4,5:1 — usam `--pi-success`/`--pi-info`, não os `*-text-emphasis`.

## Validação

- Script de contraste (OKLCH → sRGB, luminância relativa) reportando antes/depois par a par nos dois temas.
- Verificação visual via navegador headless em Dashboard, listagem de ativos, formulário de ativo e administração, nos temas claro e escuro.

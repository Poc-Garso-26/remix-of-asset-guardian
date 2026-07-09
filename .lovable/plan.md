Aplicar somente o Bloco NBR-1: aumentar a área de acionamento de elementos interativos para pelo menos 24×24 CSS px, conforme WCAG 2.5.8 / NBR 17225 Requisito.

### Escopo limitado (apenas arquivos abaixo)

---

#### 1. `src/components/assets-list-page.tsx`

Ajustes:
- `IconBtn` / `IconLink` (ações Visualizar, Editar, Excluir): padronizar `min-h-9 min-w-9` (36px) e aumentar o espaçamento do container de `gap-1` para `gap-2`.
- `PageBtn` (Anterior/Próxima): padronizar `min-h-9`.
- Cabeçalhos de coluna ordenáveis (`<button>` dentro do `<th>`): adicionar padding vertical (ex.: `py-1`) para que a área clicável atinja pelo menos 24×24px, mesmo com texto em `uppercase/xs`.

Restrições:
- Não alterar tamanho visual do ícone (mantém 16px).
- A área de toque aumenta via padding.
- Não modificar cores, fontes, layout geral, tabela, paginação além do padding/gap.

---

#### 2. `src/components/app-shell.tsx`

Ajuste:
- Botão de fechar o drawer mobile (ícone `X` no header da sidebar): aumentar levemente o padding para que a área de acionamento fique acima de 24×24px com folga (não no limite exato). Ex.: de `p-1` para `p-1.5` ou `p-2`.

Restrições:
- Não alterar layout visual do header da sidebar.
- Apenas aumentar a área clicável/tocável do botão de fechar.

---

### O que NÃO será alterado

- Nenhum outro componente (nem `theme-toggle`, nem inputs, nem badges, nem gráficos).
- Nenhum critério do relatório além do item 1.
- Nenhuma cor, token, tema, fonte, lógica ou funcionalidade.

### Validação

Após cada arquivo, pausarei e informarei o que mudou. No final, farei um resumo consolidado para validação visual em desktop (clique) e mobile (toque).
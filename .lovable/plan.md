# Plano de ação — Bloco FINAL-2

Escopo: apenas os itens 3 e 4 (Importante) do relatório de varredura final. Nenhum outro arquivo ou item será modificado.

## Item 3 — Adicionar `scope="col"` em todas as tabelas

Arquivos: `src/components/assets-list-page.tsx`, `src/routes/_authenticated.administracao.tsx`, `src/routes/_authenticated.relatorios.tsx`.

- `assets-list-page.tsx`:
  - No cabeçalho dinâmico, adicionar `scope="col"` no `<th>` que renderiza cada coluna de `COLUMNS`.
  - No cabeçalho fixo, adicionar `scope="col"` no `<th>` da coluna "Ações".
- `_authenticated.administracao.tsx`:
  - Adicionar `scope="col"` nos 7 `<th>`: Nome, Usuário, E-mail, Perfil, Situação, Último acesso, Ações.
- `_authenticated.relatorios.tsx`:
  - Adicionar `scope="col"` nos 6 `<th>`: Patrimônio, Tipo, Marca/Modelo, Responsável, Setor, Situação.

Nenhuma classe, estilo ou layout será alterado — apenas o atributo de acessibilidade.

## Item 4 — Empty state na tabela de administração

Arquivo: `src/routes/_authenticated.administracao.tsx`.

- Quando `users.length === 0 && !isLoading`, renderizar uma linha no `tbody`:
  ```jsx
  <tr>
    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
      Nenhum usuário encontrado.
    </td>
  </tr>
  ```
- `colSpan={7}` corresponde ao número real de colunas da tabela (Nome, Usuário, E-mail, Perfil, Situação, Último acesso, Ações).
- Manter o estado de carregamento (`isLoading`) inalterado.

## Execução e validação

1. Aplicar item 3 nos três arquivos e informar o que mudou em cada um.
2. Aplicar item 4 no arquivo de administração e informar o que mudou.
3. Ao final, entregar resumo consolidado com as tabelas alteradas e a confirmação do empty state.
4. Executar `bun run build` para validar que não houve regressão.

Nenhum outro arquivo será tocado.
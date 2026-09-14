# Corrigir vulnerabilidades transitivas via overrides (sem tocar em react-start, router-plugin ou jspdf)

## O que a investigação mostrou (verificado no projeto)

1. **browserslist / baseline-browser-mapping — apenas tempo de build.** Na árvore instalada, quem depende de `browserslist` é `@babel/helper-compilation-targets` (compilação Babel) e o plugin de rotas; `baseline-browser-mapping` é dependência do próprio `browserslist`. Nada disso é importado por código da aplicação nem entra no bundle do servidor — só roda na máquina que compila. Risco prático em produção: baixo.
2. **js-yaml — nenhum YAML de fonte não confiável.** Não há leitura/parsing de YAML no código da aplicação. Os consumidores de `js-yaml` na árvore são a configuração do ESLint e `xmlbuilder2` (usado pelo plugin de build do TanStack Start). Nenhum recebe conteúdo enviado por usuário. Porém a versão travada hoje (`js-yaml` fixado em `4.3.0` nos overrides) fica **abaixo** da versão corrigida exigida (4.3.1+) — isso é uma correção real a fazer, não só formalidade.
3. **jspdf / dompurify — não explorável no nosso uso.** `src/lib/pdf-export.ts` gera todo o PDF com `doc.text()` e `autoTable`; não existe nenhuma chamada a `doc.html()` em nenhum lugar do código. O `dompurify` é dependência **opcional** do jspdf, usada apenas no caminho HTML. Risco prático: baixo.
4. **Todas as quatro têm versão corrigida publicada** e todas são alcançáveis por override, sem alterar `@tanstack/react-start`, `@tanstack/router-plugin` ou `jspdf`.

| Biblioteca | Instalada hoje | Alvo corrigido |
|---|---|---|
| js-yaml | 4.3.0 (travada por override) | 4.3.2 (linha 4.x, sem salto para 5.x) |
| browserslist | 4.28.2 | 4.28.9 |
| baseline-browser-mapping | 2.10.21 | 2.11.23 |
| dompurify | 3.4.11 | 3.4.15 |

## O que vou fazer

1. Ampliar o bloco `overrides` do `package.json` com as quatro bibliotecas nas versões corrigidas acima. Nenhuma versão de pacote direto é alterada — `@tanstack/react-start`, `@tanstack/router-plugin` e `jspdf` ficam exatamente como estão.
2. Reinstalar as dependências para regravar o lockfile com as versões forçadas e conferir, pacote por pacote, a versão efetivamente resolvida.
3. Rodar a suíte completa (`npm run test:all`: verificação de tipos, 27 testes unitários, 3 de acessibilidade).
4. Rodar o **build de produção** — a checagem mais importante, dado o histórico de erro 500/502 e do contexto de requisição no Cloudflare. Confirmo que o build conclui e que a configuração do Worker (`nodejs_compat` e a data de compatibilidade) segue intacta.
5. Se qualquer alvo não puder ser resolvido (ex.: a proteção de 24h para versões recém-publicadas bloquear a versão mais nova), uso a versão corrigida mais próxima que passe; se ainda assim não der, não forço — relato como pendência com avaliação de risco.
6. Reverter o override e relatar como pendência caso o build ou os testes quebrem por causa de alguma dessas versões — a estabilidade do build tem prioridade sobre a correção formal, já que os três casos de baixo risco não são exploráveis no nosso uso.

## Resumo esperado ao concluir

Para cada aviso: corrigido pela versão forçada, e a nota de risco real (build-time apenas, ou caminho HTML do PDF não utilizado). Também atualizo a nota no README que hoje cita `js-yaml@4.2.0` como mitigação, para refletir a versão nova.

## Detalhes técnicos

- Alteração de arquivos: `package.json` (apenas o bloco `overrides`), lockfile regravado, e a linha do README sobre a árvore transitiva.
- Restrição do ambiente: `bunfig.toml` define `minimumReleaseAge = 86400`, então versões publicadas há menos de 24h não instalam; isso pode limitar o alvo a uma versão ligeiramente anterior — ainda acima do limite das advisories.
- Verificação: versão resolvida de cada biblioteca em `node_modules`, `npm run test:all` e build de produção com leitura da configuração gerada do Worker.

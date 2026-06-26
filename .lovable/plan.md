## Verificação de compatibilidade

A vulnerabilidade **CVE-2026-53550** (DoS quadrático em merge keys) foi corrigida em **js-yaml 4.2.0** (`first_patched_version: 4.2.0`).

Ambos os consumidores transitivos declaram `js-yaml: ^4.1.1`:

- **xmlbuilder2** (via `@tanstack/start-plugin-core`) → `js-yaml: ^4.1.1`
- **@eslint/eslintrc** (via `eslint`) → `js-yaml: ^4.1.1`

Como `^4.1.1` aceita qualquer versão `>=4.1.1 <5.0.0`, a versão **4.2.0** é semver-compatível com os dois pacotes — não é necessário forçar override, nem subir para 5.x (que seria major e quebraria o range).

Versões 5.0.0 e 5.1.0 também existem, mas estão fora do range aceito e exigiriam override (não recomendado, dado que 4.2.0 já contém o patch).

## Plano

1. Atualizar `bun.lock` para resolver `js-yaml` em **4.2.0** nas duas cadeias (xmlbuilder2 e @eslint/eslintrc), executando `bun update js-yaml`.
2. Não alterar `package.json` (js-yaml não é dependência direta) nem adicionar `overrides`/`resolutions`.
3. Verificar a árvore com `bun pm ls | grep js-yaml` para confirmar que nenhuma cópia em 4.1.1 permanece.
4. Rodar `bun run build` e `bun run build:dev` para confirmar que o projeto continua compilando.

## Resultado esperado

- Única versão de js-yaml na árvore: **4.2.0**
- Vulnerabilidade moderada resolvida sem mudanças de API nem overrides.

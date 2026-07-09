
## Diagnóstico após investigação

Versões instaladas:
- `vite`: `^8.0.16`
- `@lovable.dev/vite-tanstack-config`: `2.7.1`
- `vite-tsconfig-paths`: `^6.0.2`

Uso do plugin no repositório (busca com `rg`):
- Zero referências em código do projeto (`src/`, `vite.config.ts`, `tsconfig.json`).
- Presente apenas em `package.json`, `bun.lock` e `package-lock.json`.
- `bun.lock` mostra: `vite-tsconfig-paths` é **peerDependency obrigatória** de `@lovable.dev/vite-tanstack-config@2.7.1` (`"vite-tsconfig-paths": ">=6.0.0"`).

Ou seja: o wrapper que define nosso `vite.config.ts` **importa `vite-tsconfig-paths` internamente** e o exige como peer dep. Ele não é código morto.

## Por que não é possível remover neste escopo

1. **Remover do `package.json`** → quebra a peer dep do wrapper; o `defineConfig` do `@lovable.dev/vite-tanstack-config` falha ao resolver o import em build/dev.
2. **Substituir por opção nativa do Vite** → o Vite 8 **não expõe** um `resolve.tsconfigPaths: true` nativo. A resolução de `paths` do tsconfig continua sendo feita via plugin (oficialmente `vite-tsconfig-paths`) ou via alias manual em `resolve.alias`. Não há equivalente 1:1 nativo suportado.
3. **Ejetar do wrapper** para controlar os plugins manualmente exigiria reconstruir em `vite.config.ts`: `tanstackStart`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `nitro`, `lovable-tagger` (componentTagger dev-only), `@lovable.dev/vite-plugin-dev-server-bridge`, `@lovable.dev/vite-plugin-hmr-gate`, `@tanstack/devtools-vite`, error loggers, dedupe de React/TanStack, detecção de sandbox (host/port/strictPort) e injeção de `VITE_*`. Isso viola explicitamente as restrições da tarefa (“não alterar estrutura das rotas / APIs / autenticação / build”) e tem alto risco de regressão silenciosa em SSR/Nitro/HMR.

## Ação proposta

**Nenhuma alteração de código.** Registrar como pendência upstream:

- Atualização a ser feita em `@lovable.dev/vite-tanstack-config` (fora deste projeto) para substituir internamente o plugin quando/se o Vite expuser resolução nativa de `paths`.
- Atualizar `.lovable/plan.md` para refletir a investigação (versões verificadas, motivo técnico, evidência de que o plugin é peer dep do wrapper).

## Entrega

Relatório final no formato pedido (Alterações realizadas, tabela de validação, Auditoria final, Conclusão) informando que:
- Nenhum arquivo de código-fonte foi modificado.
- Build/TypeScript/Rotas/Supabase/Interface/Console permanecem no mesmo estado da auditoria anterior (nada foi tocado).
- O warning específico do `vite-tsconfig-paths` continua presente e depende de release upstream.
- Nota de saúde permanece igual à auditoria anterior — não é possível melhorá-la sem ejetar do wrapper.

## Observação

Se você quiser mesmo assim seguir com a **ejeção do wrapper** (opção de alto risco que descartei acima), me diga explicitamente e eu abro um plano separado detalhando reconstrução plugin-a-plugin, matriz de testes de regressão (SSR, HMR, build de produção Nitro, Tailwind v4, componentTagger, error overlay) e rollback.

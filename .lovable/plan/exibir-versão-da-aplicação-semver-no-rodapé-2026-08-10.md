# Exibir versão da aplicação (SemVer) no rodapé

Mostrar a versão da aplicação de forma discreta, no padrão PBH, tendo o `package.json` como fonte única da verdade.

## O que será feito

1. **Versão no `package.json`**: adicionar o campo `"version": "1.0.0"` (hoje o arquivo não tem esse campo).
2. **Injeção em tempo de build**: em `vite.config.ts`, ler a versão do `package.json` e expor como `import.meta.env.VITE_APP_VERSION` via `define`, para não hardcodar o número em componentes.
3. **Helper único**: um pequeno módulo (`src/lib/app-version.ts`) que exporta `APP_VERSION` e o rótulo `GestãoTI v1.0.0`, com fallback seguro caso a variável não exista.
4. **Tela de Login**: exibir "GestãoTI v1.0.0" logo abaixo/junto do copyright já existente ("© ... Prodabel"), reaproveitando exatamente as mesmas classes de texto pequeno e o token de cor já validado para contraste.
5. **Área autenticada**: exibir a mesma linha no rodapé do sidebar (`app-shell.tsx`), abaixo dos itens "Perfil/Sair", em texto pequeno com `text-muted-foreground`. Quando o sidebar está recolhido, mostrar apenas "v1.0.0" (com o texto completo acessível para leitores de tela), para não quebrar a largura reduzida.

## Detalhes técnicos

- `vite.config.ts`: `define: { "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version) }` passado dentro de `vite: { ... }` do wrapper `@lovable.dev/vite-tanstack-config` — sem tocar em `nitro`/`tanstackStart`.
- Nenhuma mudança de layout além do texto adicionado; sem novos tokens de cor.
- Verificação: build/preview com Playwright em `/login` e numa rota autenticada, confirmando o texto renderizado nas duas telas (inclusive sidebar recolhido).

## Fora de escopo

- Automação de bump de versão, changelog ou exibição de hash de commit.

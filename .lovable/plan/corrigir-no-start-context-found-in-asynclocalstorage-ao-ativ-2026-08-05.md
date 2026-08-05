# Corrigir "No Start context found in AsyncLocalStorage" ao ativar/inativar usuário

## Causa raiz (confirmada por leitura do código instalado)

A mensagem vem do próprio TanStack Start (`@tanstack/start-storage-context`), que guarda o contexto de requisição em um `AsyncLocalStorage` importado de `node:async_hooks`. Toda server function autenticada passa pelo middleware `requireSupabaseAuth`, que chama `getRequest()` — e `getRequest()` só funciona se esse armazenamento assíncrono estiver realmente ativo no runtime do Worker.

O ajuste feito em `vite.config.ts` (`nitro: { cloudflare: { nodeCompat: false } }`) faz duas coisas ao mesmo tempo, não apenas "deixar de declarar a flag":

1. não escreve `nodejs_compat` em `compatibility_flags` do worker gerado;
2. **remove o preset de compatibilidade Node do bundle** (o Nitro só adiciona `unenvCfNodeCompat` e `platform: "node"` quando `nodeCompat` é verdadeiro).

Sem esse preset, `node:async_hooks` cai em um substituto vazio: o `AsyncLocalStorage` não propaga o contexto, `getStartContext()` não encontra nada e lança exatamente essa mensagem. Ou seja: o problema é a mudança nº 2 (remoção do `nodeCompat`), não a atualização do `@tanstack/react-start` — a versão instalada (1.168.34) continua propagando contexto do mesmo jeito, e a função de status é uma server function declarada e chamada corretamente (`createServerFn` + `useServerFn`).

Consequência importante: o erro 500/502 anterior foi "resolvido" desligando a compatibilidade Node inteira, o que quebrou o contexto de servidor. Precisamos de uma configuração que atenda aos dois casos.

## O que fazer

1. **Reativar a compatibilidade Node** em `vite.config.ts`: remover o `cloudflare: { nodeCompat: false }` (voltando ao padrão `true`, que injeta a flag e o preset de compatibilidade). O comentário atual, que atribui o 502 à flag, é substituído por uma nota explicando que a flag é necessária para o contexto de requisição.
2. **Fixar explicitamente a data de compatibilidade do Worker** (`compatibilityDate` do Nitro, gravada como `compatibility_date` no worker) em uma data recente e válida, para que a combinação flag + data seja a moderna (`nodejs_compat` v2) — é a combinação que evita o 502 anterior sem desligar a compatibilidade.
3. **Validar o build de produção** (mesmo pipeline do deploy) e ler a configuração gerada do worker, confirmando: `nodejs_compat` presente, `compatibility_date` esperada, build sem erro.
4. **Testar a ação de ativar/inativar usuário** na tela de Administração via navegador real. A autenticação gerenciada não está disponível neste projeto (Supabase externo), então o teste de ponta a ponta autenticado é feito exercitando a rota da server function contra o build servido e verificando que a resposta é o erro de autorização esperado (401/"Unauthorized") em vez do erro de contexto — o que prova que o middleware conseguiu ler a requisição. Peço a você a confirmação final logado na tela.
5. Se, ao reativar a flag, o 502 voltar a aparecer, aí sim o diagnóstico muda de rumo: nesse caso investigo o log real do SSR publicado (não desligo a compatibilidade de novo) e volto com o achado antes de mexer em mais nada.

## Observação (fora do escopo desta correção)

`src/lib/users-admin.functions.ts` mantém helpers de runtime (`ensureAdmin`, `ROLE_RANK`) no mesmo arquivo das server functions. Isso é um risco conhecido de `ReferenceError` no build, independente deste bug. Posso separar esses helpares em um módulo `.server.ts` em uma tarefa seguinte, se você quiser.

## Detalhes técnicos

- Arquivo alterado: `vite.config.ts` (opções do Nitro).
- Nada muda em `src/lib/users-status.functions.ts`, `src/integrations/supabase/auth-middleware.ts` ou `src/start.ts` — o código dessas camadas está correto.
- Verificação: `compatibility_flags` e `compatibility_date` no `wrangler.json` gerado dentro do diretório de saída do build.

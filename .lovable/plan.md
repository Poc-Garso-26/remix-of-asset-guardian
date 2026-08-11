# Auditoria de segredos no frontend — achados e remediação

## NÃO CONFORME (ação urgente) — arquivo `.env` versionado no repositório

`git ls-files .env` confirma que o arquivo `.env` está **rastreado pelo Git**, apesar de constar no `.gitignore` (o ignore não vale para arquivos já adicionados). Ele contém segredos reais de infraestrutura do Supabase self-host:

- `JWT_SECRET` (assina tokens de autenticação)
- `POSTGRES_PASSWORD`
- `DASHBOARD_PASSWORD` / `DASHBOARD_USERNAME`
- `S3_PROTOCOL_ACCESS_KEY_ID` / `S3_PROTOCOL_ACCESS_KEY_SECRET`
- `SECRET_KEY_BASE`, `VAULT_ENC_KEY`, `PG_META_CRYPTO_KEY`, `LOGFLARE_*`
- `SERVICE_ROLE_KEY` (valor atual é, na verdade, um JWT de role `anon` — mas o campo é de service role)

Importante: **esses valores não vão para o navegador**. O Vite só injeta variáveis `VITE_*` efetivamente referenciadas no código, e nenhuma delas é referenciada além de `VITE_APP_VERSION`. O risco é de exposição no repositório/imagem, não no bundle.

## Demais itens — Seguro

| Item | Situação |
|---|---|
| `VITE_*` usadas no código | Apenas `VITE_APP_VERSION` (número de versão) — Seguro |
| Chave Supabase no cliente (`src/integrations/supabase/client.ts`) | Chave `anon` pública por design, protegida por RLS — Seguro |
| Service role | Só em `client.server.ts` via `process.env` e nas Edge Functions via `Deno.env` — nunca importado em componentes; usado só dentro de handlers com `await import()` — Seguro |
| Edge Functions (QR Code) | Credenciais apenas em variáveis de ambiente do servidor — Seguro |
| localStorage | Apenas sessão do Supabase, tema e estado do menu — Seguro |
| Segredos hardcoded / comentários com credenciais | Nenhum encontrado além da chave anon — Seguro |
| Source maps | Sem configuração explícita; o padrão do Vite é desabilitado em produção — Requer verificação no build |
| Bundle de produção | Não inspecionado (build não executado nesta auditoria) — Requer verificação |

## Remediação proposta

1. **Rotacionar os segredos do `.env`** (feito por você no ambiente Supabase self-host / infraestrutura): `JWT_SECRET`, senha do Postgres, senha do dashboard, chaves S3, `SECRET_KEY_BASE`, `VAULT_ENC_KEY`. Rotacionar `JWT_SECRET` invalida sessões existentes — planejar janela.
2. **Remover `.env` do controle de versão**, mantendo o arquivo local, e adicionar um `.env.example` apenas com os nomes das variáveis (sem valores). Observação: o histórico do Git continuará contendo os valores antigos — por isso a rotação é o passo que efetivamente elimina o risco.
3. **Fixar `build.sourcemap: false` explicitamente** em `vite.config.ts`, para não depender do padrão.
4. **Verificação final**: gerar o build de produção e varrer o JS resultante por padrões de segredo (`eyJ`, `service_role`, `sb_secret_`, senhas do `.env`), confirmando que só aparece a chave anon; e confirmar ausência de arquivos `.map`.

## Detalhes técnicos

- Arquivos alterados: `.gitignore` (já contém `.env`), novo `.env.example`, `vite.config.ts` (flag de sourcemap). Nenhuma mudança em código de aplicação.
- Nada em `src/` precisa mudar: as fronteiras servidor/cliente estão corretas.

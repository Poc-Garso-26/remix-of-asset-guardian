# Plano: README.md técnico completo (pt-BR)

## Objetivo
Criar um `README.md` na raiz do projeto que permita a qualquer pessoa desenvolvedora executar, entender, manter e implantar a aplicação **GestãoTI — Sistema de Gestão de Ativos de TI** sem conhecimento prévio.

## Levantamento prévio (leitura, sem alterações)
Antes de escrever, lerei:
- `package.json`, `bunfig.toml`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `components.json`
- `src/router.tsx`, `src/server.ts`, `src/start.ts`, `src/styles.css`
- `src/routes/__root.tsx` e a lista de rotas em `src/routes/`
- `src/lib/` (auth, services, server functions: `users-admin.functions.ts`, `assets-service.ts`, `pdf-export.ts`)
- `src/integrations/supabase/*` (client, client.server, auth-middleware, auth-attacher, types)
- `supabase/config.toml`, `supabase/functions/generate-asset-qrcode/index.ts`, migrações em `supabase/migrations/`
- `.env` (apenas variáveis públicas / nomes)
- `AGENTS.md`, `.lovable/project.json`

Para extrair: scripts npm reais, dependências/versões, rotas, tabelas (`profiles`, `user_roles`, `app_role`, `assets`), buckets (`asset-qrcodes`), funções RPC (`has_role`, `handle_new_user`, `count_active_admins`), e a edge function existente.

## Estrutura do README.md

1. **Cabeçalho** — nome, descrição curta, badges de stack (React 19, TanStack Start, Vite 7, Tailwind v4, Supabase, Bun).
2. **Visão geral** — propósito (gestão de computadores, notebooks, impressoras), papéis (admin/gerente/usuario), principais funcionalidades (CRUD de ativos, QR code, relatórios PDF, administração de usuários).
3. **Arquitetura**
   - Diagrama ASCII: Browser → TanStack Router (SSR via Cloudflare Workers/Nitro) → Server Functions (`createServerFn`) → Supabase (Auth, Postgres, Storage, Edge Functions).
   - Camadas: rotas em `src/routes` (roteamento file-based), `_authenticated` como gate, server functions em `*.functions.ts`, clients Supabase (browser, server publishable, admin via `client.server.ts`).
4. **Stack & dependências principais** — tabela com versões reais extraídas do `package.json`.
5. **Estrutura de pastas** — árvore comentada do `src/`, `supabase/`, `.lovable/`.
6. **Pré-requisitos** — Bun ≥ 1.x, Node 20+ (opcional), conta Supabase (ou usar projeto já vinculado), Docker (opcional).
7. **Variáveis de ambiente**
   - Tabela com `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SB_URL`, `SB_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`.
   - Distinção client (`VITE_*`) vs server-only.
   - Exemplo `.env.example` pronto para copiar.
8. **Execução local**
   ```bash
   bun install
   bun run dev        # http://localhost:8080
   ```
   Mais: `bun run build`, `bun run build:dev`, `bun run start`, `bun run lint`, `bun run preview` (conforme `package.json`).
9. **Integração Supabase**
   - Projeto ref `gkieaxljrlocsuythjqw`.
   - Esquema: tabelas `profiles`, `user_roles`, `assets` (campos derivados de `types.ts`); enum `app_role`.
   - Funções: `has_role`, `handle_new_user` (trigger em `auth.users`), `count_active_admins`, `update_updated_at_column`.
   - RLS por `auth.uid()` + `has_role`.
   - Bucket `asset-qrcodes` (privado) e edge function `generate-asset-qrcode`.
   - Como rodar migrações (`supabase db push` ou via dashboard) e regenerar types (`supabase gen types`).
10. **Server functions & auth** — explicação de `requireSupabaseAuth`, `attachSupabaseAuth`, fluxo do bearer token, e por que `client.server.ts` só é importado dentro de handlers.
11. **Scripts disponíveis** — tabela extraída do `package.json`.
12. **Build & deploy**
    - Build padrão (Cloudflare Workers via Nitro embutido).
    - Publicação via Lovable (botão Publish, URL `*.lovable.app`).
    - Notas sobre deploy manual (self-host) referenciando docs.
13. **Execução via Docker**
    - Criar `Dockerfile` multi-stage (Bun base, build → runtime `node:20-alpine` servindo `.output/server/index.mjs` em `:8080`).
    - Exemplo pronto a colar (mostrado dentro do README como bloco, sem criar o arquivo nesta etapa).
    - Comandos: `docker build -t gestaoti . && docker run -p 8080:8080 --env-file .env gestaoti`.
14. **Execução via Docker Compose**
    - `docker-compose.yml` com serviço `app` (porta 8080, `env_file: .env`, healthcheck em `/`).
    - Comandos: `docker compose up --build`, `docker compose logs -f app`, `docker compose down`.
15. **Troubleshooting** — itens reais já enfrentados:
    - `Unauthorized: No authorization header` → middleware `attachSupabaseAuth` ausente em `src/start.ts`.
    - `Expected 3 parts in JWT; got 1` → uso indevido de `supabaseAdmin` para Data API pública.
    - Build falhando em loader protegido em rota pública → mover rota para `_authenticated/`.
    - 404 em refresh → conferir arquivo em `src/routes/`.
    - Erros de SSR em libs browser-only → mover import para handler/client-only.
    - Vulnerabilidade `js-yaml` já mitigada (4.2.0 via lockfile).
16. **Segurança**
    - RLS habilitado em todas as tabelas `public.*`.
    - Papéis em tabela separada `user_roles` + função `SECURITY DEFINER` `has_role` (sem escalonamento).
    - Service role nunca exposto ao bundle do cliente.
    - Chave anon pública é segura no front; segredos via `add_secret` (não em `.env` versionado).
    - `dependency_scan` recomendado periodicamente (`bun audit` / npm audit).
17. **Convenções de código** — Prettier, ESLint, Tailwind v4 com tokens em `src/styles.css`, shadcn `new-york`.
18. **Licença / créditos** — placeholder.

## Detalhes técnicos relevantes
- O README ficará 100% em pt-BR.
- Todos os comandos serão prontos para colar (bash).
- Blocos Dockerfile / docker-compose serão **conteúdo do README**, não arquivos novos — o usuário pediu para *documentar* a execução via Docker; criação dos arquivos pode ser feita em iteração posterior se desejado.
- Não modificarei nenhum outro arquivo do projeto.

## Entregável
Um único arquivo: `README.md` na raiz, substituindo o existente (se houver) sem perder marcações já presentes que façam sentido.

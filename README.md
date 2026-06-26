# GestãoTI — Sistema de Gestão de Ativos de TI

Aplicação corporativa para cadastro, acompanhamento e auditoria de ativos de TI (computadores, notebooks e impressoras), com autenticação por papéis (admin / gerente / usuário), geração de QR Code por ativo, relatórios em PDF e administração de usuários.

Construída em **React 19 + TanStack Start (SSR)**, **Vite 7**, **Tailwind CSS v4**, **shadcn/ui** e **Supabase** (Auth, Postgres com RLS, Storage e Edge Functions). O runtime de produção é serverless (Cloudflare Workers via Nitro).

---

## Sumário

1. [Visão geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Stack e dependências](#stack-e-dependências)
4. [Estrutura de pastas](#estrutura-de-pastas)
5. [Pré-requisitos](#pré-requisitos)
6. [Variáveis de ambiente](#variáveis-de-ambiente)
7. [Execução local](#execução-local)
8. [Scripts disponíveis](#scripts-disponíveis)
9. [Integração Supabase](#integração-supabase)
10. [Server Functions e autenticação](#server-functions-e-autenticação)
11. [Build e deploy](#build-e-deploy)
12. [Execução via Docker](#execução-via-docker)
13. [Execução via Docker Compose](#execução-via-docker-compose)
14. [Troubleshooting](#troubleshooting)
15. [Segurança](#segurança)
16. [Convenções de código](#convenções-de-código)

---

## Visão geral

| Funcionalidade | Descrição |
| --- | --- |
| Autenticação | Supabase Auth (e-mail/senha) com sessão persistida em `localStorage` |
| Papéis | `admin`, `gerente`, `usuario` (enum `app_role`), armazenados em tabela dedicada `user_roles` |
| Ativos | CRUD de computadores, notebooks e impressoras com filtros e paginação |
| QR Code | Geração on-demand por ativo via Supabase Edge Function `generate-asset-qrcode`, persistido no bucket privado `asset-qrcodes` |
| Relatórios | Exportação PDF (jsPDF + jspdf-autotable) com filtros aplicáveis |
| Administração | Cadastro e gestão de papéis de usuários (`/administracao`) — somente admins |
| Tema | Claro/escuro com tokens semânticos em `src/styles.css` |

---

## Arquitetura

```text
┌────────────────────┐   HTTPS    ┌──────────────────────────────┐
│  Browser (React 19)│ ─────────► │  TanStack Start (SSR)        │
│  Router + Query    │            │  Cloudflare Worker / Nitro   │
│  Supabase client   │ ◄────────  │  src/server.ts (entry SSR)   │
└─────────┬──────────┘  Bearer    └──────────────┬───────────────┘
          │  JWT                                  │  createServerFn
          │                                       │  + requireSupabaseAuth
          ▼                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Supabase Project                          │
│  Auth   │  Postgres (RLS)  │  Storage (asset-qrcodes)  │ Edge Fn │
└──────────────────────────────────────────────────────────────────┘
```

### Camadas principais

- **Roteamento file-based** em `src/routes/` — gerado em `src/routeTree.gen.ts` (não editar à mão).
- **Layout raiz** `src/routes/__root.tsx` provê `<html>`, `QueryClientProvider`, `ThemeProvider`, `AuthProvider` e `Toaster`.
- **Gate de autenticação** `src/routes/_authenticated.tsx` redireciona para `/login` quando não autenticado e envolve o conteúdo no `AppShell`.
- **Server Functions** (`*.functions.ts` em `src/lib/`) executam código privilegiado no servidor com `requireSupabaseAuth`.
- **Bearer attacher** (`src/integrations/supabase/auth-attacher.ts`) anexa automaticamente o token de sessão em toda chamada RPC para o servidor — registrado em `src/start.ts`.
- **Três clients Supabase** com responsabilidades distintas (ver [Integração Supabase](#integração-supabase)).
- **SSR error wrapper** (`src/server.ts`) renderiza uma página HTML amigável em caso de falha 500 do handler do TanStack Start.

---

## Stack e dependências

| Categoria | Pacote | Versão |
| --- | --- | --- |
| Framework SSR | `@tanstack/react-start` | `^1.168.26` |
| Router | `@tanstack/react-router` | `^1.170.16` |
| Build | `vite` | `^8.0.16` |
| Config Vite (Lovable) | `@lovable.dev/vite-tanstack-config` | `2.6.2` |
| UI | `react` / `react-dom` | `^19.2.0` |
| Estilos | `tailwindcss` + `@tailwindcss/vite` | `^4.2.1` |
| Componentes | `@radix-ui/*` + shadcn/ui (`new-york`) | — |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` | `^4.4.3` |
| Data fetching | `@tanstack/react-query` | `^5.83.0` |
| Supabase | `@supabase/supabase-js` | `^2.108.2` |
| PDF | `jspdf` + `jspdf-autotable` | `^4.2.1` / `^5.0.8` |
| Ícones | `lucide-react` | `^0.575.0` |
| Notificações | `sonner` | `^2.0.7` |
| Tooling | `typescript` `^5.8.3`, `eslint` `^9.32.0`, `prettier` `^3.7.3` | — |

> A árvore transitiva foi auditada: `js-yaml@4.2.0` resolvido no `bun.lock` mitiga o CVE de DoS por chaves de merge.

---

## Estrutura de pastas

```text
.
├── src/
│   ├── routes/                      # Roteamento file-based (TanStack Router)
│   │   ├── __root.tsx               # Shell HTML, providers, error/notfound boundaries
│   │   ├── index.tsx                # Página inicial
│   │   ├── login.tsx                # Tela de login (pública)
│   │   ├── _authenticated.tsx       # Gate de autenticação + AppShell
│   │   ├── _authenticated.dashboard.tsx
│   │   ├── _authenticated.ativos.*  # Lista/criação/edição de ativos
│   │   ├── _authenticated.relatorios.tsx
│   │   ├── _authenticated.administracao.tsx
│   │   ├── _authenticated.perfil.tsx
│   │   └── README.md                # Convenções de file-based routing
│   ├── components/
│   │   ├── ui/                      # shadcn/ui (button, dialog, table, ...)
│   │   ├── app-shell.tsx            # Sidebar + header autenticado
│   │   ├── asset-form.tsx
│   │   ├── assets-list-page.tsx
│   │   ├── register-user-form.tsx
│   │   └── ...                      # cep-input, confirm-dialog, status-badge, etc.
│   ├── integrations/supabase/
│   │   ├── client.ts                # Cliente browser (anon key + localStorage)
│   │   ├── client.server.ts         # Cliente service-role (admin, server-only)
│   │   ├── auth-middleware.ts       # requireSupabaseAuth (server)
│   │   ├── auth-attacher.ts         # attachSupabaseAuth (client middleware)
│   │   └── types.ts                 # Tipos gerados do schema (NÃO editar)
│   ├── lib/
│   │   ├── auth.tsx                 # AuthProvider, useAuth, can()
│   │   ├── theme.tsx                # Tema claro/escuro
│   │   ├── assets-service.ts
│   │   ├── assets-types.ts
│   │   ├── users-service.ts
│   │   ├── users-admin.functions.ts # createServerFn (Auth Admin API)
│   │   ├── pdf-export.ts            # Geração de PDFs
│   │   ├── error-capture.ts
│   │   ├── error-page.ts
│   │   ├── lovable-error-reporting.ts
│   │   └── utils.ts
│   ├── hooks/use-mobile.tsx
│   ├── router.tsx                   # createRouter + QueryClient
│   ├── server.ts                    # Entry SSR (Worker fetch handler)
│   ├── start.ts                     # createStart + middlewares globais
│   ├── styles.css                   # Tailwind v4 + tokens semânticos
│   └── routeTree.gen.ts             # AUTO-GERADO
├── supabase/
│   ├── config.toml                  # Configuração do projeto Supabase
│   ├── migrations/                  # Migrações SQL versionadas
│   └── functions/
│       └── generate-asset-qrcode/   # Edge Function (Deno) para gerar QR
├── .lovable/                        # Metadados Lovable (plan.md, project.json)
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── components.json                  # shadcn/ui config
├── bunfig.toml
└── package.json
```

---

## Pré-requisitos

- **Bun ≥ 1.1** (recomendado — gerenciador padrão deste repositório, lockfile `bun.lock`).
  Instalação: `curl -fsSL https://bun.sh/install | bash`
- **Node.js ≥ 20** (opcional, apenas se preferir `npm`/`pnpm`).
- **Conta Supabase** com um projeto ativo (ou utilize o projeto já vinculado, ref `gkieaxljrlocsuythjqw`).
- **Docker ≥ 24** + **Docker Compose v2** (opcional, apenas para execução containerizada).
- **Supabase CLI** (opcional, para rodar migrações: `bun add -g supabase`).

---

## Variáveis de ambiente

O arquivo `.env` já existe no repositório com as chaves **públicas** do projeto Supabase vinculado. Para usar outro projeto Supabase, sobrescreva-as.

### Visíveis no bundle do cliente (prefixo `VITE_`)

| Variável | Obrigatória | Descrição |
| --- | :-: | --- |
| `VITE_SUPABASE_URL` | ✅ | URL pública do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Chave anon/publishable (segura no front) |
| `VITE_SUPABASE_PROJECT_ID` | ✅ | Ref do projeto Supabase |

### Apenas server-side (nunca expor ao cliente)

| Variável | Obrigatória | Descrição |
| --- | :-: | --- |
| `SUPABASE_URL` | ✅ | Espelho server-side de `VITE_SUPABASE_URL` |
| `SUPABASE_PUBLISHABLE_KEY` | ✅ | Usada por `requireSupabaseAuth` (validação de bearer token) |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ | Usada por `client.server.ts` (operações privilegiadas — bypass de RLS) |
| `SB_URL` | opcional | Fallback de `SUPABASE_URL` para o admin client |
| `SB_SERVICE_ROLE_KEY` | opcional | Fallback de `SUPABASE_SERVICE_ROLE_KEY` |
| `LOVABLE_API_KEY` | opcional | Apenas se a aplicação for usar o Lovable AI Gateway |

### Exemplo `.env`

```dotenv
# --- Cliente (públicas) ---
VITE_SUPABASE_URL="https://SEU-PROJETO.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi..."
VITE_SUPABASE_PROJECT_ID="seu-projeto-ref"

# --- Servidor ---
SUPABASE_URL="https://SEU-PROJETO.supabase.co"
SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."   # OBTER em Project Settings > API
```

> ⚠️ **Nunca** prefixe a service role com `VITE_` — isso a injetaria no bundle do cliente.

---

## Execução local

```bash
# 1. Clonar e entrar no diretório
git clone <url-do-repo> gestaoti && cd gestaoti

# 2. Instalar dependências
bun install

# 3. Garantir que .env existe (criar a partir do exemplo acima, se necessário)
cp .env.example .env   # opcional

# 4. Subir o dev server (HMR, SSR, porta 8080)
bun run dev
```

Acesse: <http://localhost:8080>

> O primeiro usuário cadastrado se torna automaticamente `admin` (regra implementada na função `handle_new_user`). Os demais entram como `usuario`.

---

## Scripts disponíveis

| Script | Comando | Descrição |
| --- | --- | --- |
| `dev` | `vite dev` | Dev server com HMR (porta 8080) |
| `build` | `vite build` | Build de produção (Nitro → Cloudflare Worker) |
| `build:dev` | `vite build --mode development` | Build sem minificação (debug) |
| `preview` | `vite preview` | Servir o build localmente |
| `lint` | `eslint .` | Análise estática do código |
| `format` | `prettier --write .` | Formatação automática |

Equivalentes com `npm`/`pnpm` funcionam se `node_modules` for instalado por eles.

---

## Integração Supabase

Projeto Supabase utilizado: **`gkieaxljrlocsuythjqw`** (ajustável via variáveis de ambiente).

### Esquema (resumo)

| Tabela | Finalidade |
| --- | --- |
| `public.profiles` | Dados de exibição do usuário (`nome`, `email`, `username`, `active`) |
| `public.user_roles` | Papéis do usuário — enum `app_role` (`admin` / `gerente` / `usuario`) |
| `public.assets` | Computadores, notebooks e impressoras com metadados, status e localização |

### Funções e triggers

| Objeto | Tipo | Propósito |
| --- | --- | --- |
| `public.has_role(uuid, app_role)` | `SECURITY DEFINER` | Verifica papel sem disparar RLS recursivo (usada em políticas) |
| `public.handle_new_user()` | Trigger em `auth.users` | Cria `profiles` + atribui papel (`admin` se primeiro usuário) |
| `public.count_active_admins()` | `SECURITY DEFINER` | Impede remoção do último admin ativo |
| `public.update_updated_at_column()` | Trigger | Atualiza `updated_at` automaticamente |

### Storage

- Bucket **`asset-qrcodes`** (privado) — armazena PNGs gerados pela edge function `generate-asset-qrcode`.

### Edge Function

- `supabase/functions/generate-asset-qrcode/index.ts` — gera QR Code do ativo e faz upload no bucket. Invocada via `supabase.functions.invoke('generate-asset-qrcode', { body: { assetId } })`.

### Rodando migrações em outro projeto

```bash
# Login e link
supabase login
supabase link --project-ref <SEU-PROJECT-REF>

# Aplicar migrações deste repositório
supabase db push

# Regenerar tipos TypeScript (sobrescreve src/integrations/supabase/types.ts)
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

---

## Server Functions e autenticação

A camada server-side usa **TanStack `createServerFn`** (não Supabase Edge Functions para lógica interna).

### Três clients Supabase

| Client | Onde usar | Auth | RLS |
| --- | --- | --- | --- |
| `@/integrations/supabase/client` | Componentes React, hooks, realtime | Sessão do usuário | ✅ aplica |
| `@/integrations/supabase/auth-middleware` (`requireSupabaseAuth`) | Server functions que agem como o usuário | Bearer token | ✅ aplica como o usuário |
| `@/integrations/supabase/client.server` (`supabaseAdmin`) | Apenas tarefas privilegiadas (Auth Admin, webhooks) | Service role | ⛔ bypass |

### Fluxo do bearer token

1. Componente chama uma server function via `useServerFn(...)` ou direto.
2. O middleware client `attachSupabaseAuth` (registrado em `src/start.ts`) lê `supabase.auth.getSession()` e injeta `Authorization: Bearer <jwt>`.
3. No servidor, `requireSupabaseAuth` valida o JWT com `supabase.auth.getClaims(token)` e expõe `context.supabase` (atuando como o usuário), `context.userId` e `context.claims`.

### Exemplo (padrão usado em `src/lib/users-admin.functions.ts`)

```ts
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export const listarUsuarios = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // context.supabase respeita RLS para context.userId
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    return supabaseAdmin.auth.admin.listUsers()
  })
```

> O `await import('@/integrations/supabase/client.server')` dentro do handler garante que o módulo **não vaze** para o bundle do cliente.

---

## Build e deploy

### Build local

```bash
bun run build           # artefatos em .output/ (Worker + assets)
bun run preview         # servir o build localmente
```

### Deploy via Lovable

O projeto está vinculado à Lovable. Use o botão **Publish** no editor para gerar a URL `*.lovable.app`. Mudanças de frontend exigem clique em **Update** no diálogo de publicação; alterações de backend (server functions, migrações) entram em produção imediatamente.

### Self-host

O build gera um Worker compatível com Cloudflare (Nitro `cloudflare` preset por padrão). Para outros alvos consulte a documentação de Nitro e ajuste `vite.config.ts`.

---

## Execução via Docker

> Os arquivos `Dockerfile` e `docker-compose.yml` **não estão versionados** por padrão. Os exemplos abaixo são prontos para colar na raiz do projeto.

### `Dockerfile` (multi-stage, Bun)

```dockerfile
# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build ----------
FROM oven/bun:1.1-alpine AS builder
WORKDIR /app

# Dependências (camada cacheável)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Código + build
COPY . .
# Variáveis VITE_* precisam estar disponíveis no build (são embutidas no bundle)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
RUN bun run build

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

# Copia o output do Nitro
COPY --from=builder /app/.output ./.output

EXPOSE 8080
# Nitro gera um servidor Node em .output/server/index.mjs
CMD ["node", ".output/server/index.mjs"]
```

### `.dockerignore` sugerido

```gitignore
node_modules
.output
.cache
.git
.lovable
.vscode
*.log
README.md
```

### Build e execução

```bash
# Build (passando as VITE_* públicas no momento do build)
docker build \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
  --build-arg VITE_SUPABASE_PROJECT_ID="$VITE_SUPABASE_PROJECT_ID" \
  -t gestaoti:latest .

# Executar — variáveis server-only são injetadas em runtime via --env-file
docker run --rm -p 8080:8080 --env-file .env --name gestaoti gestaoti:latest
```

Acesse <http://localhost:8080>.

---

## Execução via Docker Compose

### `docker-compose.yml`

```yaml
services:
  app:
    container_name: gestaoti
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
        VITE_SUPABASE_PUBLISHABLE_KEY: ${VITE_SUPABASE_PUBLISHABLE_KEY}
        VITE_SUPABASE_PROJECT_ID: ${VITE_SUPABASE_PROJECT_ID}
    env_file:
      - .env
    ports:
      - "8080:8080"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8080/"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

### Comandos úteis

```bash
docker compose up --build -d      # build + start em background
docker compose logs -f app        # acompanhar logs
docker compose ps                 # status / healthcheck
docker compose restart app        # reiniciar serviço
docker compose down               # parar e remover containers
```

---

## Troubleshooting

| Sintoma | Causa provável | Correção |
| --- | --- | --- |
| `Unauthorized: No authorization header provided` em server functions | Middleware `attachSupabaseAuth` não registrado em `src/start.ts` | Confirme que `functionMiddleware: [attachSupabaseAuth]` está presente |
| `Expected 3 parts in JWT; got 1` | Uso de `supabaseAdmin` para Data API com chave `sb_secret_*` | Use `requireSupabaseAuth` ou o client publishable do servidor |
| `build:dev exited with code 1` com `Error: Unauthorized` | Loader de rota pública chamando server fn protegida (prerender sem sessão) | Mova a rota para `src/routes/_authenticated/*` ou chame a fn no componente (`useServerFn`) |
| 404 ao recarregar uma rota | Arquivo da rota inexistente em `src/routes/` | Crie o arquivo seguindo a convenção flat-dot (ex.: `_authenticated.relatorios.tsx`) |
| `window is not defined` em SSR | Lib browser-only importada em escopo de módulo | Mova o import para dentro de função client-only ou renomeie o arquivo para `*.client.ts` |
| Página em branco após navegação para rota filha | Layout pai sem `<Outlet />` | Inclua `<Outlet />` no componente do layout (inclusive `__root.tsx` e `_authenticated.tsx`) |
| Vulnerabilidade `js-yaml` reportada | Resolução transitiva antiga | Já mitigado — `bun.lock` resolve `js-yaml@4.2.0` |
| Cadastro de usuário não vira `admin` | Já existe pelo menos um registro em `user_roles` | A regra "primeiro vira admin" só vale na criação do primeiro usuário do sistema |

Logs úteis:

```bash
bun run dev                    # logs do dev server + erros SSR
docker compose logs -f app     # logs do container
```

---

## Segurança

- **RLS habilitado** em todas as tabelas do schema `public`. Políticas baseadas em `auth.uid()` e na função `SECURITY DEFINER` `has_role(...)`.
- **Papéis em tabela separada** (`user_roles`) — nunca em `profiles` — evitando ataques de escalonamento de privilégios via update do próprio perfil.
- **Service role nunca exposta ao cliente**: importada exclusivamente por `client.server.ts` e carregada com `await import(...)` dentro de handlers para impedir vazamento via árvore de módulos do cliente.
- **Chave anon é pública por design** (Supabase) — segura no bundle do cliente desde que as políticas RLS estejam corretas.
- **Bearer JWT** validado em cada chamada server-side com `supabase.auth.getClaims(token)`.
- **Bucket `asset-qrcodes` é privado** — acesso somente via URLs assinadas.
- **Segredos sensíveis** não devem ir para `.env` versionado. Em produção (Lovable / Cloudflare), use o cofre de secrets da plataforma.
- Auditoria periódica de dependências:

  ```bash
  bunx npm-audit-html       # ou
  npm audit --omit=dev
  ```

---

## Convenções de código

- **TypeScript estrito** (`strict: true`). Imports não resolvidos quebram o build.
- **ESLint 9** (flat config em `eslint.config.js`) + **Prettier 3**. Rode `bun run lint && bun run format` antes de commitar.
- **Tailwind v4** com tokens semânticos em `src/styles.css` (`@theme`). Não use cores hard-coded (`bg-white`, `text-[#fff]`) — sempre o token (`bg-background`, `text-foreground`).
- **shadcn/ui** estilo `new-york`, ícones `lucide`, alias `@/*`.
- **Roteamento file-based**: dot-separated flat (ex.: `_authenticated.ativos.$id.editar.tsx`). Não criar `src/pages/`.
- **Server functions**: arquivos `*.functions.ts` em `src/lib/`. Lógica privilegiada em `*.server.ts` (bloqueada para o bundle do cliente).

---

## Licença

Projeto interno — defina a licença conforme a política da sua organização.

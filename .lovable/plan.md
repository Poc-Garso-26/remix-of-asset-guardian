## Objetivo
Gerar automaticamente um QR Code único para cada ativo após criar/editar, armazenar em bucket público no Supabase Storage e exibir somente na tela de detalhes.

## Mudanças

### 1. Banco (migration)
Adicionar em `public.assets`:
- `qr_code_url text` (nullable)
- `qr_code_generated_at timestamptz` (nullable)

### 2. Storage
- Criar bucket `asset-qrcodes` (público) via tool dedicada.
- Arquivos salvos como `{asset_id}.png` (upsert: sobrescreve quando regenera).

### 3. Edge Function `generate-asset-qrcode`
Local: `supabase/functions/generate-asset-qrcode/index.ts`. Usa service role.

Fluxo:
1. Recebe `{ assetId }` no body. Valida JWT do chamador (usuário autenticado).
2. Busca ativo em `assets` (id, patrimony, serial_number, qr_code_url, qr_code_generated_at) + um "fingerprint" para decidir regeneração.
3. **Skip se já existe QR válido e os campos identificadores (id/patrimony/serial_number) não mudaram** — compara contra um hash simples embutido como query string `?v=<hash>` na `qr_code_url` salva. Se igual, retorna `{ url, skipped: true }`.
4. Monta payload:
   ```json
   {"assetId":"...","assetCode":"...","serialNumber":"..."}
   ```
5. Chama `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=<urlEncoded(payload)>`.
6. Faz upload no bucket `asset-qrcodes` em `{assetId}.png` com `upsert: true`, `contentType: image/png`.
7. Obtém public URL e anexa `?v=<hash>&t=<timestamp>` para cache-busting.
8. `UPDATE assets SET qr_code_url=..., qr_code_generated_at=now() WHERE id=...`.
9. Retorna `{ url }`. Em qualquer falha → status 500 com mensagem, logs detalhados via `console.error`. **Nunca lança no caminho de salvar do ativo.**

CORS: headers permissivos padrão (`*`), método POST + OPTIONS.

### 4. Registrar a função
- `supabase/config.toml`: adicionar entrada `[functions.generate-asset-qrcode]` com `verify_jwt = true`.

### 5. Frontend — disparo assíncrono pós-save
- `src/lib/assets-service.ts`: após `create` e `update` retornarem com sucesso, disparar (fire-and-forget) `supabase.functions.invoke("generate-asset-qrcode", { body: { assetId: id } })`. Erro só é logado (`console.warn`) + toast leve "Não foi possível gerar o QR Code agora." — **o salvamento do ativo permanece bem-sucedido**.
- Tipos: adicionar `qrCodeUrl?: string` e `qrCodeGeneratedAt?: string` em `Asset` (`src/lib/assets-types.ts`); mapear em `rowToAsset`.

### 6. Exibição
- `src/routes/_authenticated.ativos.$id.index.tsx`: novo card "QR Code" mostrando `<img src={asset.qrCodeUrl} alt="QR Code do ativo" />` quando presente; placeholder "QR Code ainda não gerado" caso contrário. Botão opcional "Gerar agora" que chama a mesma edge function e invalida a query.
- **Não** exibir nos formulários de cadastro/edição.

### Detalhes técnicos
- API gratuita: `api.qrserver.com` (sem chave).
- Cache-busting via querystring na URL salva — o arquivo é sempre sobrescrito (upsert), então só 1 arquivo por ativo.
- Fingerprint = `sha256(assetId|patrimony|serialNumber)` truncado, calculado na edge function; comparado com o `v` da URL atual.
- Edge function lê `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (já disponíveis no runtime Supabase).

## Fora de escopo
- Reprocessamento em lote dos ativos existentes (pode ser feito sob demanda abrindo cada detalhe e clicando "Gerar agora", ou em uma migration posterior).
- Versionamento histórico de QR Codes.
- Alteração da lógica de autenticação ou RLS existentes.

# Correção — "Gerado em" não atualiza ao regenerar o QR Code

## Causa raiz (verificada)

A Edge Function `generate-asset-qrcode` calcula uma "impressão digital" a partir de `id + patrimônio + nº de série` e compara com a versão embutida na URL atual (`?v=...`). Quando nada mudou nesses campos — o caso normal ao clicar em "Regenerar" — ela retorna imediatamente `{ url, skipped: true }` **sem** regravar a imagem nem atualizar `qr_code_generated_at`. Por isso a data/hora exibida abaixo da imagem continua a mesma.

A invalidação do cache no frontend (`queryKey: ["asset", id]`) está correta: ela relê o banco, mas o banco não mudou.

## Alterações

1. `supabase/functions/generate-asset-qrcode/index.ts`
   - Aceitar `force?: boolean` no corpo da requisição.
   - Pular o atalho de cache quando `force === true`, seguindo para geração, upload (`upsert`), nova URL assinada e `update` de `qr_code_url` + `qr_code_generated_at`.
   - Manter o comportamento atual (cache/`skipped`) quando `force` não for enviado, para chamadas automáticas.

2. `src/lib/assets-service.ts`
   - `regenerateAssetQrCode(assetId, options?: { force?: boolean })` passa `force` no corpo e retorna também `skipped`, para o botão poder diferenciar.

3. `src/routes/_authenticated.ativos.$id.index.tsx`
   - O clique em "Regenerar" (quando já existe QR Code) chama com `force: true`; "Gerar agora" continua sem `force`.
   - Toast de sucesso passa a mencionar a atualização da data ("QR Code atualizado" / descrição com data-hora).

## Validação

- Chamar a Edge Function com e sem `force` para o mesmo ativo e conferir por consulta SQL que `qr_code_generated_at` só avança no caso `force`.
- Conferir na tela de detalhe do ativo que a linha "Gerado em ..." muda após o clique.

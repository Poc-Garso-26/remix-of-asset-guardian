## Objetivo
Ao excluir um ativo, remover também o arquivo do QR Code do bucket `asset-qrcodes` no Supabase Storage, evitando arquivos órfãos.

## Abordagem
Criar uma edge function `delete-asset-qrcode` (com verificação de JWT + role admin/gerente, mesmo padrão da `generate-asset-qrcode`) que apaga o(s) objeto(s) do bucket referentes ao `assetId`. Chamar essa function no `assetsService.remove` **antes** do `delete` da linha em `assets` (para que, se a remoção do storage falhar, o ativo não seja excluído silenciosamente sem o arquivo — ou seguir fire-and-forget, ver decisão abaixo).

Alternativa mais simples (sem edge function): usar `supabase.storage.from('asset-qrcodes').remove([...])` direto do cliente. Como o bucket é privado e as políticas atuais permitem leitura autenticada, precisaríamos garantir política de DELETE para admin/gerente em `storage.objects`. A edge function é mais alinhada ao padrão atual do projeto (toda manipulação do bucket passa por function com service role).

**Decisão recomendada:** edge function, fire-and-forget com log de warning em falha (mesmo padrão do `triggerQrCodeGeneration`), para não bloquear a UX de exclusão do ativo.

## Passos

1. **Edge function `supabase/functions/delete-asset-qrcode/index.ts`**
   - Validar JWT e role (`admin` ou `gerente`), igual à `generate-asset-qrcode`.
   - Receber `{ assetId }`.
   - Listar objetos no prefixo do ativo (padrão atual salva em `assets/{assetId}.png` ou similar — confirmar no código da function existente) e chamar `storage.from('asset-qrcodes').remove([...])`.
   - Retornar `{ removed: number }`.
   - Configurar no `supabase/config.toml` (verify_jwt = true).

2. **`src/lib/assets-service.ts`**
   - Adicionar helper `triggerQrCodeDeletion(assetId)` (fire-and-forget, warn em erro).
   - Em `remove(id)`: chamar `triggerQrCodeDeletion(id)` antes do `delete` da linha (assim mesmo com CASCADE ainda temos referência ao id para o storage).

3. **Deploy** da nova edge function.

## Fora de escopo
- Migração/limpeza retroativa de QR Codes já órfãos no bucket.
- Alteração da política de RLS do bucket.
- Mudanças de UI.

## Critério de aceitação
- Excluir um ativo com QR Code gerado remove o arquivo correspondente do bucket `asset-qrcodes`.
- Excluir um ativo sem QR Code não gera erro visível ao usuário.
- Falha na exclusão do storage não impede a exclusão do ativo (apenas log de warning no console), mantendo o padrão fire-and-forget já usado na geração.

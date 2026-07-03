## Objetivo

Atualizar o `README.md` para documentar a nova Edge Function `delete-asset-qrcode` e o fluxo de remoção do QR Code no Storage ao excluir um ativo.

## Alterações no README.md

### 1. Tabela "Visão geral"
Ajustar a linha de **QR Code** para deixar claro que o PNG é removido do bucket automaticamente na exclusão do ativo.

### 2. Seção "Integração Supabase → Edge Function"
Substituir o item único por uma lista com as duas funções:
- `generate-asset-qrcode` — gera o QR e faz upload no bucket privado `asset-qrcodes`. Invocada em `create` e `update` do ativo.
- `delete-asset-qrcode` — remove `{assetId}.png` do bucket `asset-qrcodes` antes de excluir o ativo do banco. Requer papel `admin` ou `gerente`; usa `SUPABASE_SERVICE_ROLE_KEY` internamente para o `storage.remove`.

Incluir também um trecho curto descrevendo o fluxo de exclusão:

```text
assetsService.remove(id)
  └─► supabase.functions.invoke('delete-asset-qrcode', { assetId })
        └─► storage.from('asset-qrcodes').remove([`${id}.png`])
  └─► supabase.from('assets').delete().eq('id', id)
```

Nota: a invocação da função de exclusão é "best-effort" — falhas são logadas via `console.warn` e não bloqueiam a exclusão do ativo (comportamento já implementado em `triggerQrCodeDeletion`).

### 3. Seção "Estrutura de pastas"
Adicionar a nova função dentro de `supabase/functions/`:

```text
supabase/functions/
├── generate-asset-qrcode/
└── delete-asset-qrcode/
```

### 4. Seção "Segurança"
Adicionar bullet: exclusão de ativo dispara remoção do QR no Storage via edge function autorizada (admin/gerente), evitando arquivos órfãos no bucket privado.

## Fora de escopo

- Nenhuma alteração de código, migração ou configuração.
- Sem mudanças em outras seções do README (env, docker, troubleshooting, scripts).

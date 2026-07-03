## Plano

1. **Confirmar a causa do preview não atualizar**
   - Os logs atuais do Vite não mostram erro de runtime, então a falha provavelmente está no build/typecheck mais recente ou no estado do HMR.
   - Verificar o build do preview para capturar o erro exato, sem alterar funcionalidade.

2. **Corrigir apenas o necessário**
   - Se o erro estiver relacionado à última alteração de exclusão de QR Code, ajustar `src/lib/assets-service.ts` ou a Edge Function `delete-asset-qrcode` mantendo o fluxo pedido: remover o arquivo do storage ao excluir o ativo.
   - Se for configuração ausente, registrar corretamente a função em `supabase/config.toml` conforme o padrão do projeto.
   - Se for apenas HMR/preview preso, liberar o gate de HMR e validar `/ativos`.

3. **Validar**
   - Rodar a verificação de build apropriada.
   - Abrir `/ativos` no preview e confirmar que a página carrega sem erro.
   - Não alterar layout nem regras de negócio além do mínimo para restaurar o preview.
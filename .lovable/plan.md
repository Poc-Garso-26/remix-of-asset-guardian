Plano de ação — Bloco FINAL-4

Escopo: apenas os itens 7 e 9 (prioridade Importante) do relatório de varredura final. Nenhum outro arquivo ou item será modificado.

## Item 7 — Associar mensagens de erro aos campos de senha

Arquivo: `src/components/register-user-form.tsx`

- Adicionar `id="error-password"` e `id="error-confirm"` nas mensagens de erro (`<p className="text-xs text-destructive">`) dos campos Senha e Confirmar senha.
- Adicionar `aria-invalid={!!errors.password}` e `aria-describedby={errors.password ? "error-password" : undefined}` no `<PasswordInput id="reg-password">`.
- Adicionar `aria-invalid={!!errors.confirm}` e `aria-describedby={errors.confirm ? "error-confirm" : undefined}` no `<PasswordInput id="reg-confirm">`.

Nenhuma classe, estilo ou layout será alterado — apenas os atributos de acessibilidade.

## Item 9 — Aumentar área de toque do botão "Voltar para ativos"

Arquivo: `src/routes/_authenticated.ativos.$id.index.tsx`

- No botão de voltar (linhas 67-72), adicionar `min-h-9` às classes existentes para garantir área de toque mínima de 36px de altura, conforme padrão do Bloco NBR-1.
- O tamanho do texto (`text-xs`) será mantido, já que a correção visa apenas a altura da área de acionamento.

## Execução e validação

1. Aplicar item 7 no formulário de cadastro e informar o que mudou.
2. Aplicar item 9 na tela de detalhes do ativo e informar o que mudou.
3. Ao final, entregar resumo consolidado com os arquivos alterados e as mudanças de acessibilidade aplicadas.
4. Executar `bun run build` para validar que não houve regressão.

Nenhum outro arquivo será tocado. Os Blocos FINAL-1, FINAL-2 e FINAL-3 permanecem intactos.
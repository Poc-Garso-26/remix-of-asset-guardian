## Objetivo
Ao passar o mouse sobre a miniatura do QR Code na coluna "QR Code" de `/ativos`, exibir uma versão ampliada (mesmo tamanho da tela "Visualizar Ativo": `h-48 w-48` com `p-2`, fundo branco, borda) em um floating card, sem clique.

## Mudança única
**`src/components/assets-list-page.tsx`**

1. Importar `HoverCard`, `HoverCardTrigger`, `HoverCardContent` de `@/components/ui/hover-card` (já existente — Radix-based, lida com posicionamento, colisão de bordas, z-index e fechamento automático ao sair do trigger ou do conteúdo).

2. Substituir o `<img>` da célula `qrCode` por:
   ```tsx
   <HoverCard openDelay={120} closeDelay={80}>
     <HoverCardTrigger asChild>
       <img
         src={a.qrCodeUrl}
         alt=""
         loading="lazy"
         className="h-10 w-10 rounded-sm border border-border bg-white object-contain"
         onError={(e) => { e.currentTarget.style.display = "none"; }}
       />
     </HoverCardTrigger>
     <HoverCardContent
       side="right"
       align="start"
       sideOffset={8}
       collisionPadding={12}
       className="w-auto p-2"
     >
       <img
         src={a.qrCodeUrl}
         alt={`QR Code do ativo ${a.patrimony}`}
         className="h-48 w-48 rounded-md border border-border bg-white p-2"
       />
     </HoverCardContent>
   </HoverCard>
   ```
   - Reutiliza a mesma URL já carregada na listagem (sem nova consulta, sem nova geração).
   - O `HoverCardContent` só monta no DOM quando aberto (lazy via Radix Portal).
   - O Portal garante z-index acima da tabela e evita deslocamento de linhas/colunas.
   - `collisionPadding` mantém a imagem totalmente visível e reposiciona automaticamente perto das bordas.
   - Envolver o `<img>` trigger num wrapper `onClick={(e) => e.stopPropagation()}` (a `<tr>` tem `onClick` de navegação — sem isso, hover + clique acidental abriria a página do ativo).

3. Sem alterações no cabeçalho, ordenação, paginação, filtros, célula vazia para ativos sem QR, ou em qualquer outra coluna.

## Não alterado
- Sem mudanças em schema, RLS, serviços, edge function, `Asset`, ou na tela "Visualizar Ativo".
- Sem novos componentes ou arquivos.
- Layout da tabela permanece idêntico (miniatura `h-10 w-10`, célula com mesmo padding).

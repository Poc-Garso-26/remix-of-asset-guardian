## Causa raiz

O Radix `HoverCard` é um primitivo desenhado só para hover/focus, não para toque. No mobile, o fluxo produz este ciclo travado:

1. **1º toque no QR** — o `<img>` recebe foco; o HoverCard abre por causa do focus (fallback do Radix para teclado).
2. **Toque fora** — dispara `onPointerDownOutside`, o HoverCard fecha, **mas o `<img>` continua sendo o `document.activeElement`** (o toque fora em áreas sem elementos focáveis não move o foco no iOS/Android).
3. **2º toque no mesmo QR** — como o elemento **já está focado**, o browser não dispara um novo `focus`, e o HoverCard não tem handler de `click`/`pointerup` no trigger. Resultado: nada reabre.
4. Tocar em outro elemento move o foco → o próximo toque no QR volta a disparar `focus` e reabre. Isso confirma a hipótese.

Ou seja, `HoverCard` no touch depende de uma transição de foco que o segundo toque no mesmo alvo não produz.

## Correção

Trocar `HoverCard` por `Popover` **apenas quando o dispositivo é touch**, mantendo `HoverCard` no desktop (hover continua idêntico, requisito do usuário). `Popover` do Radix trata o trigger como toggle por clique/pointer, então tocar → abre; tocar fora → fecha; tocar de novo no mesmo trigger → abre (Radix ignora o `pointerDownOutside` quando o alvo é o próprio trigger).

### Passos

1. **Detecção de touch** — reutilizar o hook existente `src/hooks/use-mobile.tsx` (ou adicionar um `useIsTouch()` baseado em `matchMedia('(hover: none) and (pointer: coarse)')` se o `use-mobile` for só breakpoint). Preferência: `(hover: none)`, que é o critério correto para o problema (não largura de tela).
2. **Novo componente local** `QrCodePreview` dentro de `src/components/assets-list-page.tsx` (ou arquivo próprio se ficar grande) que:
   - Se `hover: none` → renderiza `Popover` + `PopoverTrigger asChild` + `PopoverContent` com o mesmo conteúdo/estilo atual (imagem 48x48).
   - Caso contrário → renderiza o `HoverCard` atual, sem mudanças.
   - Trigger continua sendo o `<img>` com `tabIndex={0}`, `alt`, `loading="lazy"` e `onError` já existentes (mantém o item 15 da auditoria).
3. **Substituir** o bloco `HoverCard` inline dentro do `<td>` do QR Code (linhas ~316–342) por `<QrCodePreview asset={a} />`.
4. **Verificar** que `@/components/ui/popover` já existe (shadcn). Se não, adicionar via shadcn CLI — mas o projeto já usa Radix Dialog/HoverCard, provavelmente Popover já está disponível; confirmar antes de importar.

### Fora do escopo

- Nada muda no comportamento desktop/hover.
- Nenhum outro item da auditoria é tocado.
- Sem mudanças em serviços, tipos ou rotas.

## Validação

- Desktop: hover no QR → abre; sair → fecha; hover repetido → OK (inalterado).
- Mobile (DevTools em modo touch ou celular real): tocar no mesmo QR várias vezes seguidas → abre/fecha consistentemente; tocar em outro QR também funciona; foco continua acessível via teclado (Enter/Space com Popover também abre).

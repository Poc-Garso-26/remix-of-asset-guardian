# Content-Security-Policy (defesa em profundidade)

Adicionar cabeçalhos de segurança nas respostas HTML da aplicação, começando em modo somente-relatório e depois trocando para bloqueio.

## Domínios externos realmente usados (verificado no código)

| Domínio | Uso | Diretiva |
|---|---|---|
| `https://gkieaxljrlocsuythjqw.supabase.co` | API, Auth, Storage (imagens de QR Code) | `connect-src`, `img-src` |
| `https://fonts.googleapis.com` | CSS das fontes (Inter, Instrument Serif) | `style-src` |
| `https://fonts.gstatic.com` | arquivos de fonte | `font-src` |
| `https://viacep.com.br` | busca de endereço por CEP | `connect-src` |
| própria origem | app, scripts, imagens | `'self'` |

Também são necessários `data:` e `blob:` em `img-src` (QR Code em canvas/base64) e `blob:` em `object-src`/`frame-src`… na prática o jsPDF abre/baixa o PDF via `blob:`, então `blob:` fica liberado apenas onde é preciso.

## Política proposta

```text
default-src 'self';
base-uri 'self';
form-action 'self';
object-src 'none';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https://gkieaxljrlocsuythjqw.supabase.co;
connect-src 'self' https://gkieaxljrlocsuythjqw.supabase.co https://viacep.com.br;
frame-src 'self' blob:;
worker-src 'self' blob:;
frame-ancestors <ver observação abaixo>;
```

Justificativas das permissões menos restritivas:
- `script-src 'unsafe-inline'`: o app tem um script inline de tema em `__root.tsx` (evita flash de tema errado) e o TanStack Start injeta scripts inline de hidratação/SSR. Usar nonce exigiria interceptar e reescrever o HTML de streaming — risco alto de quebrar o SSR. Fica registrado como melhoria futura.
- `style-src 'unsafe-inline'`: Tailwind/Radix/Recharts injetam estilos inline (`style=` e `<style>` gerado). Remover quebraria gráficos e componentes de UI.

## Observação importante sobre `frame-ancestors 'none'`

O preview do editor Lovable carrega a aplicação dentro de um iframe. Com `frame-ancestors 'none'` o preview deixa de renderizar. Proposta: aplicar `frame-ancestors 'none'` apenas fora do ambiente de preview (detectando o host `*.lovable.app` de preview / `NODE_ENV`), mantendo `https://lovable.dev https://*.lovable.app` permitidos no preview. Assim o site publicado fica protegido contra clickjacking sem perder o preview.

## Como será implementado

1. Novo módulo `src/lib/security-headers.ts` com a montagem da política (uma função pura, mais uma lista de domínios em um único lugar) e um flag para alternar entre `Content-Security-Policy-Report-Only` e `Content-Security-Policy`.
2. `src/server.ts` (wrapper de fetch já existente) passa a aplicar os cabeçalhos apenas em respostas HTML (`content-type: text/html`), preservando o restante da resposta e o tratamento de erro atual. Junto com o CSP, incluir `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` e `X-Frame-Options: DENY` (equivalente legado, alinhado ao `frame-ancestors`).
3. Fase 1 — somente relatório: subir com `Content-Security-Policy-Report-Only` e navegar via Playwright por login, dashboard, listagem de ativos, detalhe/edição de ativo, relatórios (geração de PDF) e QR Code, coletando as mensagens de violação do console.
4. Fase 2 — ajuste: para cada violação real, ampliar a diretiva mínima necessária (nunca relaxar para `*`).
5. Fase 3 — bloqueio: trocar o cabeçalho para `Content-Security-Policy` e repetir a navegação completa, confirmando console limpo e funcionalidades intactas (imagens de QR Code carregando, PDF sendo gerado, fontes aplicadas, login funcionando).

## Entrega

Ao final: a política exata aplicada, exceções que foram necessárias e o registro dos testes de navegação com o resultado do console.

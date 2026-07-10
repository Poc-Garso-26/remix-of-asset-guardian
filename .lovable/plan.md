## Plço de ação — Bloco FINAL-1

Escopo: apenas os itens 1 e 2 (Crítico) do relatório de varredura final. Nenhum outro arquivo ou item será modificado.

### Item 1 — Traduzir páginas de erro/404 para português

Arquivo: `src/routes/__root.tsx`

- `NotFoundComponent`:
  - Título "404" permanece (número).
  - "Page not found" → "Página não encontrada".
  - "The page you're looking for doesn't exist or has been moved." → "A página que você procura não existe ou foi movida.".
  - "Go home" → "Voltar para o início".
- `ErrorComponent`:
  - "This page didn't load" → "Esta página não carregou".
  - "Something went wrong on our end. You can try refreshing or head back home." → "Algo deu errado do nosso lado. Você pode tentar recarregar ou voltar para o início.".
  - "Try again" → "Tentar novamente".
  - "Go home" → "Voltar para o início".

Nenhuma alteração de estilo, layout, cor ou classe será feita — apenas o texto.

### Item 2 — Corrigir hierarquia de headings na tela de Login

Arquivo: `src/routes/login.tsx`

- No painel esquerdo de marketing, o título "Inventário completo do seu parque de TI, em um só lugar." está atualmente em `<h2>`.
- Rebaixar para `<p>` (mantendo classes e aparência visuais), já que é conteúdo decorativo/marketing.
- O `<h1>"Entrar"</h1>` no formulário direito permanece como único heading de nível 1 da página.

### Execução e validação

1. Aplicar item 1 em `src/routes/__root.tsx` e informar o que mudou.
2. Aplicar item 2 em `src/routes/login.tsx` e informar o que mudou.
3. Ao final, entregar resumo consolidado com todos os textos alterados e a confirmação de que a hierarquia de headings foi corrigida.

Nenhum outro arquivo será tocado.
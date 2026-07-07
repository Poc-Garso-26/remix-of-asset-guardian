# Bloco B — Correções críticas de semântica (itens 1, 4, 5)

Escopo restrito. Sem mudanças visuais — apenas estrutura semântica/acessível. Aplicar item por item, parando após cada um para reporte.

## Item 1 — Associação explícita `label`/`for`+`id`

**Arquivos:** `src/components/asset-form.tsx`, `src/components/assets-list-page.tsx`, `src/routes/_authenticated.administracao.tsx`.

**Mudanças:**
- `asset-form.tsx` → helper `Field`:
  - Gerar `const id = useId()` dentro do componente.
  - Trocar `<label>` wrapper por `<label htmlFor={id}>` com o mesmo `className`.
  - Injetar o `id` no filho via `React.cloneElement(children, { id: (children as any).props.id ?? id })`, preservando `id` já definido (ex.: campos que já vierem com `id` próprio).
  - Manter marcação, classes e layout idênticos.
- `assets-list-page.tsx` → helper `FilterInput` (linha 422):
  - Mesmo padrão: `useId()`, `<label htmlFor={id}>`, `<input id={id} ...>`.
- `_authenticated.administracao.tsx` → helper `FilterInput` (linha 320):
  - Mesmo padrão do acima.

**Fora:** não mexer nos call-sites, nem em `CepInput`/`PasswordInput` (já têm `id` próprio).

**Parar e reportar** após concluir o item 1.

## Item 4 — Landmark `<main>` no login

**Arquivo:** `src/routes/login.tsx`.

**Mudança:** trocar a `<div className="flex items-center justify-center px-4 py-12 lg:px-12">` (coluna direita do formulário) por `<main className="...">`, preservando exatamente as mesmas classes e filhos. Nenhum outro ajuste.

**Parar e reportar** após concluir o item 4.

## Item 5 — Hierarquia de headings no login

**Arquivo:** `src/routes/login.tsx`.

**Mudança:**
- Painel esquerdo (marketing, `hidden lg:flex`): trocar o `<h1 className="font-display text-5xl leading-[1.05]">` por `<h2>` com as mesmas classes (o conteúdo continua idêntico visualmente).
- Painel direito (formulário): trocar `<h2 className="text-2xl font-semibold tracking-tight">Entrar</h2>` por `<h1>` com as mesmas classes.

Resultado: sempre haverá um `<h1>` visível ("Entrar") independentemente do breakpoint, sem qualquer alteração de estilo.

**Parar e reportar** após concluir o item 5, e em seguida enviar o resumo consolidado dos 3 itens para validação (visual + teclado/leitor de tela).

## Validação
- Typecheck automático da plataforma.
- Nenhuma classe Tailwind alterada → layout deve permanecer pixel-idêntico.
- Sem screenshots Playwright necessários salvo se surgir suspeita de regressão visual.

## Fora de escopo
Todos os demais itens do relatório (Blocos C e D e itens não listados).

## Bloco NBR-7 — Contraste de componentes (WCAG 2.2 SC 1.4.11)

Escopo: apenas contraste ≥ 3:1 em bordas, ícones informativos, checkbox e anel de foco. Nada mais é alterado. NBR-1 e NBR-2 permanecem intactos.

### 1. Diagnóstico de contraste (medido em oklch/L*)

| Token | Tema | Valor atual | Fundo | Contraste aprox. | Status |
|---|---|---|---|---|---|
| `--pi-border` / `--input` | claro | `oklch(0.9 0.008 240)` | `oklch(0.985…)` bg / `oklch(1 0 0)` card | ~1.35:1 | FALHA |
| `--pi-border` / `--input` | escuro | `oklch(1 0 0 / 12%)` | `oklch(0.23…)` card | ~1.25:1 | FALHA |
| `--muted-foreground` | claro | `oklch(0.5 0.02 250)` | card branco | ~4.6:1 | OK |
| `--muted-foreground` | escuro | `oklch(0.72 0.02 250)` | card `0.23` | ~7:1 | OK |
| `--ring` (usado com `/20`) | ambos | opacidade 20% | vários | < 2:1 efetivo | FALHA |

Alto contraste já usa preto/branco puro em bordas — nada a fazer nesse tema.

### 2. Ajustes em `src/styles.css`

Manter identidade visual, apenas escurecer/clarear o mínimo necessário:

- Tema claro:
  - `--pi-border: oklch(0.78 0.01 240)` (antes `0.9 0.008 240`) → contraste ≈ 3.1:1 sobre card branco.
  - `--pi-border-strong: oklch(0.62 0.015 240)` (antes `0.78`) para manter hierarquia.
- Tema escuro:
  - `--pi-border: oklch(1 0 0 / 35%)` (antes `12%`) → contraste ≈ 3.1:1 sobre `--pi-surface`.
  - `--pi-border-strong: oklch(1 0 0 / 55%)` (antes `22%`).
- `--muted-foreground` permanece (já passa 3:1 e AA texto). Sem mudança para não descaracterizar a paleta.
- `--ring` mantém valor atual (já ≥ 3:1 sólido).

### 3. Ajustes em componentes (remover `ring-ring/20`)

Trocar `focus:ring-2 focus:ring-ring/20` por `focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background` em:

- `src/routes/login.tsx` (2 ocorrências)
- `src/routes/_authenticated.administracao.tsx` (2 ocorrências)
- `src/routes/_authenticated.relatorios.tsx` (1)
- `src/components/cep-input.tsx` (1)
- `src/components/assets-list-page.tsx` (3)
- `src/components/asset-form.tsx` (`inputCls`)

Não mexer em componentes shadcn de `src/components/ui/*` (já usam `ring-ring` sólido).

### 4. Checkbox customizado em `asset-form.tsx`

Linhas 229 e 233 — os dois `<input type="checkbox">` usam `border-input`. Com o novo `--input` (oklch 0.78) a borda passa a atingir 3:1 automaticamente; nenhuma classe adicional necessária além do que já herdam do token corrigido. Sem alterações no JSX.

### 5. Resultado esperado (após correção)

| Elemento | Claro | Escuro |
|---|---|---|
| Borda de input/border geral | ~3.1:1 | ~3.1:1 |
| Anel de foco (sólido) | ~4:1 | ~4.5:1 |
| Ícones muted-foreground | ~4.6:1 | ~7:1 |
| Checkbox border | ~3.1:1 | ~3.1:1 |

### 6. Validação (manual, após aplicar)

Verificar nos dois temas:
1. Bordas dos inputs em `/login`, `/ativos`, `/ativos/novo`, `/administracao` — perceptíveis sem "sumir" no fundo.
2. Ícones informativos (lupa, chevrons, ícones em cards) mantêm legibilidade.
3. Checkbox de "Colorida" e "Rede" em `/ativos/novo` — borda visível quando desmarcado.
4. Tabulação pela página exibe anel de foco nítido em botões, links e inputs.

## Objetivo
Adicionar toggle de visibilidade (ícone olho) em todos os campos de senha do app, sem alterar a lógica de autenticação ou validações.

## Componente novo
**`src/components/ui/password-input.tsx`** — `PasswordInput` reutilizável:
- Wrapper sobre `<Input>` do shadcn (mantém estilos, foco, tema claro/escuro, responsividade).
- `useState` interno `visible` (inicial `false`).
- Renderiza `<Input type={visible ? "text" : "password"} className="pr-10" ... />` dentro de um container `relative`.
- Botão `<button type="button">` posicionado absolutamente à direita, com ícone `Eye`/`EyeOff` (lucide-react).
- Acessibilidade: `aria-label` dinâmico ("Mostrar senha" / "Ocultar senha"), `aria-pressed`, `tabIndex={-1}` para não interromper o fluxo de tab do formulário; foco do input preservado ao clicar.
- `React.forwardRef<HTMLInputElement>` repassando todas as props do `Input` (id, value, onChange, autoComplete, required, etc.) para preservar integrações existentes.
- Sem lógica de validação ou autenticação.

## Pontos de uso (apenas trocar o input, manter props)
1. **`src/routes/login.tsx`** — campo `#password` (atualmente `<input type="password">` cru). Substituir por `PasswordInput` mantendo classes/aria/autocomplete (`current-password`).
2. **`src/components/register-user-form.tsx`** — campos `#reg-password` e `#reg-confirm` (`<Input type="password">`). Substituir por `PasswordInput` mantendo `autoComplete="new-password"`.

## Fora de escopo
- Nenhuma mudança em `auth.tsx`, server functions, validações de senha (`length < 6`, `password !== confirm`), ou fluxos de submit.
- Sem alteração de estilos globais; o toggle herda tokens semânticos (`text-muted-foreground`, `hover:text-foreground`) para compatibilidade com tema claro/escuro.

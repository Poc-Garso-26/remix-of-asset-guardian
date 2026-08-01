# Bloco G-4 — Validação do formulário de ativo

Corrigir a exibição de erros no formulário de ativo (usado em Novo ativo e Editar ativo), onde hoje só o primeiro erro aparece como tooltip nativo do navegador e os campos são limpos na segunda tentativa de salvar.

## Causas identificadas

1. **Tooltip "Preencha este campo"**: o componente `Field` injeta o atributo HTML `required` nos inputs e o `<form>` não desativa a validação nativa do navegador. O navegador bloqueia o envio e mostra seu próprio balão no primeiro campo vazio — a validação do Zod (que geraria o texto vermelho abaixo de todos os campos) nem chega a rodar.
2. **Campos limpos / mudança de formato na segunda tentativa**: a seção "Alocação" está duplicada no formulário (aparece duas vezes, linhas ~150-202), registrando os mesmos campos (`sector`, `responsible`, `location`, `logradouro`, `bairro`, `cidade`, `uf`, `acquisitionDate`) duas vezes. Com registros duplicados o react-hook-form sincroniza valores/refs entre os dois inputs de forma inconsistente, o que explica valores sumindo e o foco/erro apontando para o campo "errado". A segunda cópia também não está marcada como obrigatória, então o navegador para de bloquear e o Zod passa a rodar — daí a troca de tooltip para texto vermelho.

## Correções (incrementais, nesta ordem)

1. **Padrão único de erro**: adicionar `noValidate` ao `<form>` e deixar de injetar o atributo `required` no DOM em `Field` (mantendo apenas `aria-required` e o asterisco visual). Assim toda validação passa pelo Zod e todos os erros aparecem juntos como texto vermelho abaixo de cada campo, já associados via `aria-invalid`/`aria-describedby`.
2. **Preservar valores**: remover a seção "Alocação" duplicada, mantendo uma única seção com os campos obrigatórios marcados. Nenhum campo é perdido — todos os campos continuam presentes uma vez.
3. **Foco no primeiro erro (WCAG 3.3.1)**: no `handleSubmit`, tratar o callback de erro para focar (e rolar até) o primeiro campo inválido, seguindo a ordem dos campos no formulário. Complementar com um resumo curto acessível (`role="alert"`) informando quantos campos precisam de correção.

## Validação

Rodar o formulário no navegador (Playwright) em `/ativos/novo` e em Editar ativo: tentar salvar vazio (esperado: vários textos vermelhos simultâneos, sem tooltip nativo, foco no primeiro campo com erro), preencher parcialmente e salvar de novo (esperado: valores preenchidos preservados, apenas os erros restantes exibidos, mesmo formato visual). Screenshots das duas tentativas para conferência.

## Arquivos afetados

- `src/components/asset-form.tsx` (único arquivo de código alterado)

Aplicar 5 correções de acessibilidade avulsas, uma por vez, parando após cada uma para validação.

## Item 9 — Contraste "Ativo"/"Inativo"
**Arquivos:** `src/routes/_authenticated.administracao.tsx`, `src/routes/_authenticated.perfil.tsx`.

- Verificar `text-success` e `text-destructive` sobre `bg-card` nos dois temas.
- No tema escuro `--pi-success` = oklch(0.72 0.14 150) e `--pi-danger` (equivalente) sobre card escuro tendem a passar; no tema claro, `--pi-success` = oklch(0.58 0.14 150) fica no limite (~4.0:1). Ajuste: usar variante *text-emphasis* já disponível (`--pi-success-text-emphasis` = oklch(0.42 0.13 150) no claro / oklch(0.85 no escuro) e equivalente para danger), trocando as classes por utilitárias baseadas nesses tokens — sem alterar a paleta.
- Implementação mínima: substituir `text-success`/`text-destructive` nos badges de "Ativo"/"Inativo" por `text-[color:var(--pi-success-text-emphasis)]` e `text-[color:var(--pi-danger-text-emphasis)]` (ambos os arquivos), garantindo ≥4.5:1 em ambos os temas. Nenhuma outra mudança visual.

## Item 14 — Contexto em botões de paginação
**Arquivo:** `src/components/assets-list-page.tsx` (linhas ~380–381).

Adicionar `aria-label` dinâmico:
- Anterior → `Página anterior, página {page-1} de {totalPages}` (ou `Sem página anterior` quando `page === 1`).
- Próxima → `Próxima página, página {page+1} de {totalPages}` (ou `Sem próxima página` quando `page >= totalPages`).

## Item 15 — QR Code acessível por teclado
**Arquivo:** `src/components/assets-list-page.tsx` (HoverCard ~316–325).

- Trocar `alt=""` do trigger por `alt={\`QR Code de ${a.patrimony}\`}`.
- Adicionar `tabIndex={0}` no elemento gatilho para torná-lo focável (HoverCard do Radix abre em focus além de hover).

## Item 16 — Foco visível no toggle de situação
**Arquivo:** `src/routes/_authenticated.administracao.tsx` (botão dentro de `<td>` com `bg-transparent p-0 border-0`).

Adicionar ao `className`: `rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card`.

## Item 19 — Texto "SITUAÇÃO" em case normal
**Arquivo:** `src/routes/_authenticated.administracao.tsx`.

Trocar o literal `SITUAÇÃO` do `<th>` por `Situação`. O `<thead>` já aplica `uppercase` via CSS, então o efeito visual permanece.

## Regras
- Nenhuma outra alteração de estilo, layout ou paleta além do necessário no item 9.
- Pausa após cada item com relatório do que mudou.
- Resumo consolidado ao final.

# Avaliação: remover o card "Modelo RBAC" em Usuários & permissões

## 1. Propósito atual (verificado no código)

O bloco está em `src/routes/_authenticated.administracao.tsx` (linhas 286–305), como uma `<section>` estática:

- É **100% informativo**: não há estado, handler, tooltip dinâmico nem link. O texto `src/lib/auth.tsx` está dentro de um `<code>`, é apenas texto — não abre nada.
- O único acoplamento é o ícone `Shield` do lucide, também usado no item de menu "Administração" em `src/components/app-shell.tsx` — o import continua necessário lá, mas na página de administração o `Shield` só é usado neste card (linha 6 do arquivo importa e usa apenas aqui).
- Expor `src/lib/auth.tsx` na interface **é vazamento de detalhe de implementação**: o usuário final (servidor da Prodabel) não tem acesso ao repositório, e a informação revela estrutura interna sem valor operacional. Recomendação: remover essa referência independentemente da decisão sobre o card.

## 2. Impacto da remoção

- Verificado: **não existe outro lugar** na aplicação com a explicação dos perfis. Os nomes aparecem apenas como opções de `select` (`register-user-form.tsx`, `edit-user-role-dialog.tsx`), no filtro/estatísticas da própria tela e em `roleLabel()` (`src/lib/auth.tsx`). Não há tela de ajuda, onboarding ou documentação in-app.
- A legenda dos três perfis (o que cada um pode fazer) é a **única** orientação disponível. Removê-la sem substituição deixa o administrador sem referência ao escolher/alterar o perfil de um usuário, e o usuário comum sem explicação de por que certas ações não aparecem para ele.
- Sem impacto funcional: nenhuma regra de permissão depende deste bloco (a matriz real vive em `PERMISSIONS` em `src/lib/auth.tsx`).

## 3. Alternativas

Recomendação: **(d) manter a legenda dos perfis, remover a referência técnica** — combinada com (b) se você quiser a tela mais limpa.

- **(a) Remover sem substituição** — tela mais enxuta; perde a única explicação dos perfis. Não recomendado agora.
- **(b) Ícone de ajuda (?)** ao lado do título da seção de usuários / do campo de perfil, abrindo popover com a legenda dos três perfis. Mantém a informação, tira o peso visual do rodapé. Boa opção, mas exige atenção a acessibilidade (botão com nome acessível, foco, ESC — padrão já usado no `QrCodePreview`).
- **(c) Página de documentação separada** — mais completo, porém cria rota nova, entrada de menu, breadcrumb, SEO/head e manutenção; desproporcional para três linhas de texto.
- **(d) Manter só a legenda** (recomendado): apagar a frase técnica com `src/lib/auth.tsx`, manter título (ex.: "Perfis de acesso") e a lista Administrador/Gerente/Usuário, reescrita em linguagem de negócio (sem "CRUD"). Ganho imediato, risco zero, sem perda de informação.

## 4. Arquivos afetados (nenhuma alteração feita ainda)

- `src/routes/_authenticated.administracao.tsx` — bloco nas linhas 286–305; se o card for removido por completo (opção a), remover também `Shield` do import da linha 6.
- `src/components/app-shell.tsx` — **não** alterar; usa `Shield` para o menu.
- `src/lib/auth.tsx` — **não** alterar; contém a matriz real de permissões.
- Nenhum teste da suíte (`tests/unit`, `tests/a11y`) referencia este card; `test:all` continua válido.

## Próximo passo

Confirme qual caminho seguir — (a), (b), (c) ou (d) — que eu implemento somente após sua validação.
